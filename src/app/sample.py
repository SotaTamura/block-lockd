import base64
import gzip
import math

# Constants from Unity project
MAX_GRID_DIVISION = 32

# 旧形式のマスク解析用（GameManager.csのLoadStageにハードコードされているもの）
MASK_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
# ポータルのタグ用（Utility.csのBASE62）
TAG_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
# 新形式のエンコード用
BASE128_ALPHABET ="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ΓΔΘΛΞΠΣΦΨΩβδεζηθκλμξπτφχψωБГДЖИЛПФЦЧШЩЪЫЭЮЯвджзиклмнптфцчшщъыьэюя_"

def parse_base(s, alphabet):
    res = 0
    base = len(alphabet)
    for char in s:
        res = res * base + alphabet.index(char)
    return res

def least_bits_for_size(pos):
    max_sz = MAX_GRID_DIVISION - pos
    if max_sz <= 1: return 0
    return math.floor(math.log2(max_sz - 1)) + 1

def to_binary(value, bits):
    if bits == 0: return ""
    return bin(int(value))[2:].zfill(bits)

def transform(old_code):
    # 1. Decompress old data
    compressed_data = base64.b64decode(old_code)
    decompressed_data = gzip.decompress(compressed_data).decode('utf-8')

    # 2. Parse and Translate Coordinates
    objects = []
    for entry in decompressed_data.split(';'):
        if not entry: continue
        mask_str, props_str = entry.split(':')
        mask = parse_base(mask_str, MASK_ALPHABET)
        props = props_str.split(',')

        full_props = [None] * 8
        idx = 0
        for i in range(8):
            if (mask & (1 << i)):
                full_props[i] = props[idx]
                idx += 1

        gid = int(full_props[0] or 0)
        # 16 -> 32 scaling
        x_scaled = round(float(full_props[1] or 0) * 2)
        y_scaled = round(float(full_props[2] or 0) * 2)
        w_new = round(float(full_props[3] or 1) * 2)
        h_new = round(float(full_props[4] or 1) * 2)

        # --- Y-Flip Logic ---
        # Old: y=0 is top. New: y=0 is bottom.
        # Height of stage is 32. 
        # y_new is the bottom-left corner in the new system
        y_new = 32 - y_scaled - h_new

        # --- Rotation Logic ---
        # angleIndex: 0:Right, 1:Down, 2:Left, 3:Up
        # Do not flip angles anymore as LoadStage uses the same angleIndex * -90 logic
        ang_new = int(full_props[5] or 0)

        w_stored, h_stored = w_new, h_new

        if gid == 6: # oneway
            if ang_new == 1 or ang_new == 3:
                w_stored = h_new
            else:
                w_stored = w_new

        obj = {
            'gid': gid,
            'x': x_scaled,
            'y': y_new,
            'w': w_stored,
            'h': h_stored,
            'ang': ang_new,
            'color': int(full_props[6] or 0),
            'tag': full_props[7] or ""
        }
        objects.append(obj)

    # 3. Handle Portals (Merge pairs into single entries)
    portals = [o for o in objects if o['gid'] == 7]
    others = [o for o in objects if o['gid'] != 7]

    portal_pairs = {}
    for p in portals:
        tag = p['tag']
        if tag not in portal_pairs: portal_pairs[tag] = []
        portal_pairs[tag].append(p)

    merged_data = others
    for tag in sorted(portal_pairs.keys()):
        pair = portal_pairs[tag]
        if len(pair) < 2: continue
        p1, p2 = pair[0], pair[1]
        if (p1['ang'] == 1 or p1['ang'] == 2):
            p1, p2 = p2, p1

        # Axis: 0 for X(Vertical Portal), 1 for Y(Horizontal Portal)
        # Horizontal direction (0, 2) -> axis 1. Vertical direction (1, 3) -> axis 0.
        axis = 1 if p1['ang'] % 2 == 0 else 0

        w_stored, h_stored = p1['w'], p1['h']
        x1_final, y1_final = p1['x'], p1['y']
        x2_final, y2_final = p2['x'], p2['y']

        portal_entry = {
            'gid': 7,
            'x': round(x1_final), 'y': round(y1_final),
            'w': w_stored, 'h': h_stored,
            'axis': axis,
            'pairX': round(x2_final), 'pairY': round(y2_final),
            'color': p1['color'],
            'tag': tag
        }
        merged_data.append(portal_entry)

    # 4. Sort and Build Bitstream
    merged_data.sort(key=lambda o: o['color'])

    binary_str = ""
    current_color = 0
    for obj in merged_data:
        while current_color < obj['color']:
            binary_str += "00000" # next color marker
            current_color += 1

        gid = obj['gid']
        binary_str += to_binary(gid, 5)
        binary_str += to_binary(obj['x'], 5)
        binary_str += to_binary(obj['y'], 5)

        if gid == 6: # oneway
            binary_str += to_binary(obj['ang'], 2)
            binary_str += to_binary(obj['w'] - 1, least_bits_for_size(obj['x'] if obj['ang'] % 2 == 0 else obj['y']))
        elif gid == 7: # portal
            binary_str += to_binary(obj['w'] - 1, least_bits_for_size(obj['x']))
            binary_str += to_binary(obj['h'] - 1, least_bits_for_size(obj['y']))
            binary_str += to_binary(obj['axis'], 1)
            binary_str += to_binary(obj['pairX'], 5)
            binary_str += to_binary(obj['pairY'], 5)
        elif gid in [8, 10, 11, 12]: # rotateables (Lever, Button, MoveBlock)
            binary_str += to_binary(obj['w'] - 1, least_bits_for_size(obj['x']))
            binary_str += to_binary(obj['h'] - 1, least_bits_for_size(obj['y']))
            binary_str += to_binary(obj['ang'], 2)
        else:
            binary_str += to_binary(obj['w'] - 1, least_bits_for_size(obj['x']))
            binary_str += to_binary(obj['h'] - 1, least_bits_for_size(obj['y']))

    # 5. Base128 Encode
    result = ""
    for i in range(0, len(binary_str), 7):
        chunk = binary_str[i:i+7].ljust(7, '0')
        val = int(chunk, 2)
        result += BASE128_ALPHABET[val]

    return result

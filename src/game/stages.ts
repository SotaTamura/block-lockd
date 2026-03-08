export const STAGES: Record<
    number,
    {
        title: string;
        code: string;
        hint: string;
        difficulty: number;
    }
> = {
    1: {
        title: "上陸",
        code: "H4sIAAAAAAAAAzXOOw7AMAgD0At5COSf3Kdjx56/hgSJ4WE5KH0VCEd2v0qhGRiBHmj7WQpRNKhzoFIfNU+cfWE5I9+OQCqHNxTJcMKCul9TtUbxNFmheUzw/dH9p3jxBzl65G66AAAA",
        hint: "矢印キーで左右移動・ジャンプ\n上下キーでハシゴを上り下りできる\nステージの外へ脱出しよう",
        difficulty: 1,
    },
    2: {
        title: "廊下",
        code: "H4sIAAAAAAAAAzWOuxHAMAhDF1JhGX/OZp+UKTN/BE6O5gkEgnN3ECTMmSxCPSwAnfeuWBgqO8JS1H9CNNmmWMtsHl0WMO48wWDYzC+JgY6VRJF9RAX3s5jvWHLJSVpKiKEQRtwLUAkNVbYAAAA=",
        hint: "鍵を取ると、それと同じ色のブロックが消える",
        difficulty: 1,
    },
    3: {
        title: "架け橋",
        code: "H4sIAAAAAAAAA1VPOwKFMAy6EINJf9rex/GNnl9I4/AmIEDSjllhGGsE9sSWWBNLoifaeqbDDkVp/rZozNuYDcaMSiE6nL2gjsGqPbPIN0dF2QNGtP5PSldtuacID3DVd0vn1h1BWiWo4cTH6G/KKB/Ud6/JqRmRE+NDVF+liesF6iUhTBIBAAA=",
        hint: "既に消えているブロックは、その色の鍵を取ると復活する",
        difficulty: 1,
    },
    4: {
        title: "雲",
        code: "H4sIAAAAAAAAA12QQRbDIAhELzQvT1A06n267LLnLxONsd3J5w+oUpqhHgYRWBdW5lVFHoWwEe9zgT6Og8kTlM6nKSQieU8RaAzmwxbSqUEXupLRxz1BGUj+g5Hzz306c+eS8kAVEn7Hc+PG8mJpY0S+e93svv0mxT4fuVkvJwHiSetvdo1lvs4BtKdCqZfGrf6rh30BR9Jm7XwBAAA=",
        hint: "鍵は全て取るとは限らない",
        difficulty: 2,
    },
    5: {
        title: "路地",
        code: "H4sIAAAAAAAAA12QQRbEIAhDL8TrExVa9T5ddjnnH4LV0dnlB4UAn1WIMymlxq+WqeMhC2XKW+VH7PpTI3HyQjhkGHEi3zXhLYe1ERztUAhtuYPSOWSha/Xt/ywwb5U0dEazxg8m0kXR4EYaH94ek9jM50ZsxvMFQyd/Ym/te0CbaP2wWujjulH+DT/LdBLhrguqJdnQhu2cByOK7S+WXD1XAehYAtITitNrB0jYAVJHKt1DKU3sN5T1hHaKdlZG2/wF1PZp1x0CAAA=",
        hint: "同じ色の鍵を取るたび、その色のブロックの状態が切り替わる",
        difficulty: 2,
    },
    6: {
        title: "渦",
        code: "H4sIAAAAAAAAA0WQsRXDMAhEF6IwFhKW1HqEzKAyZebPAcJ+NP/g4AGso1IlPkgmG3diOgMLsAWyxeR7NGIoQQ2mD6TVTsg2TWmoqWaUhAK4AwR9u1gTNF0aLqErXYV6upgzBeIFvGKgPIpdrdjKz7iDbUG2S9Dvu26sL+qL/UW2D6xAu+I3TjgLGnV+wT65e9oo1jULdlxRf/ok7/eC/7HGEP9v2fkj04dhwzx/vvwBbi2jL6oBAAA=",
        hint: "一方通行ブロック\n\n矢印の逆の向きに進むことはできない\n色がついているものは、その色の鍵を取ると向きが180°切り替わる",
        difficulty: 2,
    },
    7: {
        title: "細胞",
        code: "H4sIAAAAAAAAA1WSSZLDIAxFL6SFPwgw5gpZ5gxe9v2XjdBQSsVVeU+yBmyPhwmVeA2FpnB55LJIt0A3L/HPC+NpBJbLpBMKdeUhTYwBugnKdWNZ+D5d5mJ7lduO764kMSxP1z2phiHbzDJCWIvggiQzuKWKmcfcuWKmITNV3LqnFwRzijc92/rY7mVX73O/6SjFk/dPbuRU1ZR3EZOn/dG9Sd/Ee4yDRtAM2hMDq2FThLG0627zyGvPyu9nH95iuO4WqlbFjPthPd1pi6UcK8FXKoLyUa0/4Xb0xK/9Qz/hS96PfJYyFPwP2R+3EMsCAAA=",
        hint: "2つの黄色の鍵を取るタイミングが大事",
        difficulty: 3,
    },
    8: {
        title: "虹",
        code: "H4sIAAAAAAAAAz1RSRLDMAj7EJMx3m2+0GPfkGOOfX8RhkwPSEEgmY5diWkI37tQpkGdWIZ9nMJjdwDAe2ftd/1l4Z8RVlKoQ9aoKS0B+xkGHCHgCo1jtcSeI1nwB1SzHLgB+2gFnrAtQEzpauo8IzUmu6eO9Nlr8Vq9Nq+hX6fq4iSfbQk46fIst7KFqEW+aOAQBS84jWkJfLgF6AFGgFezzt04X+19Qj6HZXjOsxuXnXoeJc8GhK4E4YgAWVXZEFuaLIXue8wCQwLRUlEX98B/an07KQdOrk0gHGpl1RTJGvoKxo76B/ZypYQyAgAA",
        hint: "自分で考えよう",
        difficulty: 3,
    },
    9: {
        title: "歪み",
        code: "H4sIAAAAAAAAA02QOxLDIAxEL6TJIGGQwVVi+wY5g0vfv4w+4Gho3uqzLFydIMnBut2GCFgMsQTOzpcyiKCBPJGhgFsQNFh8Cw19Uu3Iygus4LbNCO+epSh3SG9DFrXqLm14CVcZIxXcK7jjQEyBMTAFzg9T2KW4THGb4jo9+6SZssa47bXoYb9d41n0YVGAX0XdKSiaSuptzqGep2zvPcSu6l9Ig47O4MZvFxpMKn9VRX1ciYeuiWJTDfYxtljW3RtZrzpGJ9kvq+QhE5zzXmudHi9baO6auP4Au9WHpDICAAA=",
        hint: "ポータル\n\n同じアルファベットが書かれたポータル同士を行き来できる",
        difficulty: 2,
    },
    10: {
        title: "研究所",
        code: "H4sIAAAAAAAAAz1RMZLEIAz7kCeDTYAEqrvb3WrLe0PKLe/9J9mEmRQSCNlSPt0kiUoZlyPgOj6AWnCqcazO9mFXb6LKL8vXsDdoFRID1daL1K0ItEOvnnFXcZdvjyyaQqXk2eckaXLeck308vMTikBc5BgtUAophHvMcTvFWxv24Hph/j3ZzgXA4hVm4WBYw5UBPqaKDRjZFYkY6Rn5GNcQihmf2GKnJ7q4kS00l2negA2NFHyXZyLUQ43npGfk4wTRrcws9Grc12UHHrU1Ii2UpzqTVW+HKfZVQtro9RP8jCLAfjsrOIQdvW7K8BkUlhnzzliT/6a6t2+CfDdKC9n4mwnUO2KM1tmz2j+kqVaCWwIAAA==",
        hint: "自分で考えよう",
        difficulty: 4,
    },
    11: {
        title: "ダンジョン",
        code: "H4sIAAAAAAAAA01QQQ6DMAz7UIRIaFrWnAYcOe4NHDnu/XMS0FCLZMdx6nB2oRGHqx2A7LDY6VAdj4PaNwR2hR5cBiWNQjphYL2toeIzTlGp0GQNGCbjMwCjKDepIBwdeOlqAfJyvabkGMkA4zOBHL1Rc5FWkx0kAkvyzXnxO9H7onFAGshML1r+bTAtxnuveJx5iDcpNplQ0Qz0gewZfC9fonX1gOJaYMFYTex+Nt767C2MfvyLpJJUsHhEKj/EkEVfkQEAAA==",
        hint: "レバー\n\nその色のブロックの状態を何度でも切り替えることができる",
        difficulty: 3,
    },
    12: {
        title: "坑道",
        code: "H4sIAAAAAAAAA1VRWw4CIRC7EDE7vIaFLxOP4Bn89NPz2xZUDCTbzpbSGZ49hgPL6ngAGuAHWcEeT+JCRVH9lILVCs2seYghDReyVSkhC1UsX8iOcI7XhBYyzhh/NBihNowO0KRlEmWraoZoqY0SfGSUJsnDlBNUNdLEOxIXLRJ/ti+mX1x43v3o8oJq9pLRgR2UlKADdWKfuQmjBmC3Xqll3A+JO0k7yTspO6k7aTvxnZw7UfM/9pfB/kLYTBG9O5vBvo546+yGKa7UNdzkGq1IW++KXvlCuHjc4XWirBGTVJGEMXi34BfkewN+T0swUgIAAA==",
        hint: "自分で考えよう",
        difficulty: 3,
    },
    13: {
        title: "双子",
        code: "H4sIAAAAAAAAA1VSSY7DMAz7kFBEXiTHPhXIW+bY47y/IqOpp8iBpBaLlvOaRY74tK+foLopCLi+EA8qTWylCKnZcEpfv8E8WIkKRE9GmVfRJmWpz+ip0G3pNQ3hEQ36UeeX0uNbKqXPMCFnoh5LMaRyRhwMd4UuwKJLnAzuO5kxdvvFkZXRERUtnffoRl5RXG/rJJu2TW3TAXr91W7R/gujgH39YE1siT3REj1xED3znnnPvEceMwbuHXeJNUUsN9+5Q/CBzdptCNc2LoFFhTOLT8e6/dHluco18bBY1XPhnnofyZc0WscvoI0Ej/0GxNUtPFICAAA=",
        hint: "一度に両方のプレイヤーが動く",
        difficulty: 2,
    },
    14: {
        title: "異世界",
        code: "H4sIAAAAAAAAA1VRS46FMAy7UPTUpD+gq5E4C0uW7/zjOOlIIwSxTT5O+14mBY/29QBqwNdhBzuoFpKxvi430SImfU1nFQIRARNkyiFG8ZQZWoHYIJLUT0d6wbfFUAW1Tzg4BDKwPqyvHPXyh2a+UQu7VQYnGaJnDZ/Vls7APjOKz2xz0v52xVUy3Wlzws729++5Kqn9o40L6NIXHJP8hZOGRS1jzdgy9owjo5YNdqXuUt21yoneH3Y6WugNdrhTXz3ZCDIvP1i/k8B+gz0gOsGXzYsAzn+W3SC4IRADRZqfEk/gJuTG2UrBOWH4glxBfemM2n4Bq8Pk8UkCAAA=",
        hint: "自分で考えよう",
        difficulty: 3,
    },
    15: {
        title: "運搬",
        code: "H4sIAAAAAAAAA0VQSQ6DQAz7kFWRTIYBckLqW3rk2PfXDoMqDl4mi8N1OBZ+tuaH1ET7pNZhll/xBnM0RA6pv+9wBPanwbDlVXRDKybe6tnR4WkyOY1dLU3Tgn67/T59jR6s6uh511NxdWjHRJ/4+DGxFzqD3LhPtCXtfazQZMea4szBc9M+B0+rjasytbrXbrHBQqLSdrXS93EMHc8/caa/KQLLS68n1zEkBnHXgigSzHcVeiVXicUPiY77LH0BAAA=",
        hint: "押しブロック\n\n左右に押せる\nジャンプで上に押し上げることもできる\n複数まとめて押せる\nポータルでテレポートする",
        difficulty: 4,
    },
    16: {
        title: "建築",
        code: "H4sIAAAAAAAAAz1PSQ4DIQz7UFSNAyGFnCrxlh7n2PfXyUwrONjxQjiXysEz400EIvSCBCYYcebYiob6cup5X6GbZAoeJkqKvZ6lqTTRwFXH0UH2KTKkE6fgwlBVH2mwgK+WW/y8HNPSLgLmOk2ZHDya9kGz3XYu+q9GhkdsGrKlCcLXzBI0GvhCxXwhn+AOU/IbVlr9zm4R/Ques3kDHQEAAA==",
        hint: "階段を作ろう",
        difficulty: 4,
    },
    17: {
        title: "地下水道",
        code: "H4sIAAAAAAAAA11SOQ7DMAz7kFBYvo+pQMeOfUPGjn1/SSkO0CJAQIoUHck5ZpSAR+t6A2oRxWsdViYrVg8CLVhZVZIkdyfJ4uYoHYpVowzxtExHNL04bN6laenbs5TJ5h7AZX1YlgoWbsVdmQIi1bqNexD9eswENfOhA+EBvDvO5nfMY1FvE8WMCU6QNygb1A3aBlfX2ADL2EgvFC90pSsOf80qzebntM77Hx9/HENchWP31xXbbBwky33FBzB9sN2XPmZH6pBzXgoBbZ0KUMdS0HgywzzLGNer1J48WXjBEQs6afyl6ZfmTdssjOH6Pn457VYg2TX69+y927C2Ld2/BT+hfAF+OuJNjQIAAA==",
        hint: "ボタン\n\n押し始めた瞬間と、離した瞬間に、その色のブロックの状態を切り替える\nプレイヤーまたは押しブロックで押せる",
        difficulty: 3,
    },
    18: {
        title: "屋根裏",
        code: "H4sIAAAAAAAAA1VQSRLDIAz7kCcTg00Wrn1C35Bjjn1/JRvS6XCwhIVkc59FVhxt/QJUQu83oYNp6dvANgTE3j+Ji5iUaBTZqNaQE6dJhaAGPHA9kS8wWXw4VqlLOjahUe1KYjgrhLgOIR9BsIzxNJwzz9DQBx94oNfJ6MYY0g0UrU24kIk/tY5qUXX9AZ+g9dfZcmakTOyZyPmgKYk1dhg4Y5QPcJ+LTGZ/rAZ7J+GHaLaMJpqGCNnnmrvk0mNl5z9zIfxsjI050cyq9gWU967V5AEAAA==",
        hint: "協力してジャンプしよう",
        difficulty: 3,
    },
    19: {
        title: "マラソン",
        code: "H4sIAAAAAAAAAzVPMRLDIAz7kAdsDJQw5S5jxr4hY8e+v5JNj8GSkYR4DpOCo319AqpoWw+gSiX8ElZxsBoSVZKEvKlrANpfC5NzbalookU8A8NbM5HrDpHSPAWyiBm56hQP6UvfxBU4C9yggzGNQl6GlIFhRCqfKZDqFcyDMSr4a2ttHIPQ5Vx2AcPmWJxMaayGRvl6GCQ/OtHVMdFf5p62p9oP1C6e5k0BAAA=",
        hint: "スピードが大事",
        difficulty: 3,
    },
    20: {
        title: "駐車場",
        code: "H4sIAAAAAAAAA01QQQ7DIAz7UFQ1AUqB06Qed9x9tx173PtnJ3SbIiHbIbHh7CYrSnW8AJWwjJOwgE0M0STPG2x8MQ678PrTm1RHDTU1W7hwXcqw2qvs0iDchh0gmtgQA9cafipp6NF3Lk7obMFSMAtWgu3BarAcrAUrQx/do3Fn5gJ6hNJogrbKhlZEKFPZ/5R350PUjStwZQC/xcnEc+iTvPmmhLoUpMgchIScd0qVF/w7/B1uxl/LnsxHGBdWNND8AXleoxulAQAA",
        hint: "駆動ブロック\n\n動力を与えられると矢印部分が光り、その方向に動き始める\nプレイヤーや押しブロックは押される\n壁に当たると止まる\nもう一度動力を与えられると元に戻り、止まる",
        difficulty: 3,
    },
    21: {
        title: "高速道路",
        code: "H4sIAAAAAAAAA02ROxqEIAyEL5SCABKFale02nN4/yPsJBL0o2CGP+QBV40UKFJsFxTnKQMWlyYm89jdr2Pn4CK6uEN5eas4VXC1uigu8iirYaXFXkVNIqbP7RQkSm4BGfD7QAb8OtzA9sk2oN0RTqhPJEDdEbLQMdECdDjSTs6JtJGzca9FHw19YYZhk52olar5TP6qtWdx0xdUGL6rxz15YcF642xDuZN74Cc3e3Kplso+wMrnP3sLNVPmAQAA",
        hint: "操作には慣れてきたかな?",
        difficulty: 2,
    },
    22: {
        title: "柱",
        code: "H4sIAAAAAAAAA0VQO67DMAy7kBBEkj+xPbXI2LFnyNjxnf+RUoPCi0hTFKXPNNnx1NcHpYqq2PoLVn2rgmKr60qiyHGXVdSypcoBmi0mnWoYXIEaOm7NLi1YDZ9l1+xw4I/LY9kLEJYABthnyWHao8XRbCckHqJnAigKmOfSc+outjEJxOyq+IJ9Ye0Mwlwlf5oMShNkiqwHa7tF0dKWvmcThjDM+nqr9LCLnFK/y3ss7xm6IwAPNEAP4QUHGIzFNfukG04Ob9xbOSxOHbOD0T1HE1Ca1hScwTlW9Z9eeQxs8SI6CBwmR0xSKf8U45c25gEAAA==",
        hint: "ブロックをポータル間に跨らせた状態で静止させてみよう",
        difficulty: 4,
    },
};

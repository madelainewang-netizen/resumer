"""从 Noto Sans SC 可变字体生成 react-pdf 可用的 Regular / Bold 静态字重。
用法：python3 scripts/build-fonts.py path/to/NotoSansSC-VF.ttf
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

SRC = sys.argv[1] if len(sys.argv) > 1 else "NotoSansSC-VF.ttf"
ranges = [
    (0x0020, 0x024F),   # Latin + Latin-1 + Latin Ext
    (0x02B0, 0x02FF), (0x0370, 0x03FF),  # modifiers, Greek
    (0x2000, 0x206F),   # general punctuation
    (0x2070, 0x209F), (0x20A0, 0x20CF),  # super/subscripts, currency
    (0x2100, 0x218F),   # letterlike, number forms
    (0x2190, 0x21FF), (0x2200, 0x22FF),  # arrows, math
    (0x2460, 0x24FF),   # enclosed alphanumerics ①
    (0x2500, 0x25FF), (0x2600, 0x26FF), (0x2700, 0x27BF),
    (0x3000, 0x303F),   # CJK symbols & punctuation
    (0x3040, 0x30FF),   # kana
    (0x3200, 0x33FF),   # enclosed CJK, compatibility
    (0x4E00, 0x9FFF),   # CJK unified (basic)
    (0xFE30, 0xFE4F), (0xFF00, 0xFFEF),  # compat forms, fullwidth
]
unicodes = [c for a, b in ranges for c in range(a, b + 1)]
for weight, name in [(400, "Regular"), (700, "Bold")]:
    font = TTFont(SRC)
    inst = instantiateVariableFont(font, {"wght": weight}, updateFontNames=False)
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.hinting = False
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=unicodes)
    sub.subset(inst)
    out = f"public/fonts/NotoSansSC-{name}.ttf"
    names = inst["name"]
    for nid in (1, 2, 3, 4, 6, 16, 17, 25):
        names.removeNames(nameID=nid)
    # 两个字重必须有不同的 PostScript 名，否则 react-pdf 会把它们当成同一个字体
    for nid, val in [(1, "Noto Sans SC"), (2, name), (3, f"NotoSansSC-{name}-resumer"),
                     (4, f"Noto Sans SC {name}"), (6, f"NotoSansSC-{name}")]:
        names.setName(val, nid, 3, 1, 0x409)
        names.setName(val, nid, 1, 0, 0)
    inst["OS/2"].usWeightClass = weight
    inst["head"].macStyle = 1 if name == "Bold" else 0
    inst.save(out)
    print(out)

"""
壓縮網站圖片

用法（在專案根目錄執行）：
    pip install pillow          # 第一次使用才需要
    python3 compress-images.py

只處理 images/events/ 與 images/courses/ 底下的 .jpg / .jpeg / .png
（不會動到 images/banner.png 等其他圖片）：
  1. 依照手機拍攝時的方向資訊把照片轉正
  2. 長邊超過 1600px 的縮小到 1600px
  3. 另存為品質 80 的漸進式 JPG
  4. 副檔名統一改成小寫 .jpg（例如 DSC04541.JPG → DSC04541.jpg、poster.png → poster.jpg）

已經夠小（500KB 以下且長邊不超過 1600px）的 .jpg 會略過，重複執行不會越壓越糊。
"""

from pathlib import Path

from PIL import Image, ImageOps

ROOTS = [Path("images/events"), Path("images/courses")]
MAX_SIDE = 1600
QUALITY = 80
SKIP_BELOW = 500 * 1024  # 500KB


def process(path: Path) -> None:
    before = path.stat().st_size
    target = path.with_suffix(".jpg")

    with Image.open(path) as im:
        already_small = (
            path.suffix == ".jpg"
            and before <= SKIP_BELOW
            and max(im.size) <= MAX_SIDE
        )
        if already_small:
            return

        im = ImageOps.exif_transpose(im)
        if im.mode in ("RGBA", "LA", "P"):
            # 透明背景（PNG）改鋪白底
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, "white")
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert("RGB")

        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        tmp = target.with_name(target.stem + ".tmp.jpg")
        im.save(tmp, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    if path != target:
        path.unlink()
    tmp.replace(target)
    after = target.stat().st_size
    print(f"{path} → {target.name}  {before // 1024}KB → {after // 1024}KB")


def main() -> None:
    files = [
        p for root in ROOTS if root.exists() for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in (".jpg", ".jpeg", ".png")
        and not p.name.endswith(".tmp.jpg")
    ]
    for p in sorted(files):
        try:
            process(p)
        except Exception as err:  # 單一檔案失敗不影響其他檔案
            print(f"略過 {p}：{err}")
    print("完成")


if __name__ == "__main__":
    main()

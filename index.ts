import express, { Request, Response } from "express";
const app = express();

import * as simpleIcons from "simple-icons";

const ICONS_PER_LINE = 15;
const ICON_BOX_SIZE = 300;
const ICON_SIZE = 256;
const ICON_SCALED_SIZE = 48;
const PADDING = (ICON_BOX_SIZE - ICON_SIZE) / 2;

const icons = Object.entries(simpleIcons).reduce(
  (accum, [key, value]) => {
    if (key == "default") return accum;
    accum[value.slug] = {
      svg: value.svg.replace(
        "<svg",
        `<svg height="${ICON_SIZE}" width="${ICON_SIZE}"`,
      ),
      hex: value.hex,
    };
    return accum;
  },
  {} as { [slug: string]: { svg: string; hex: string } },
);

function generateSvg(
  slugs: string[],
  perLine: number,
  theme: string,
  size: number,
) {
  const iconSvgList = slugs.map((i) => {
    const fillColor =
      theme == "default"
        ? `#${icons[i].hex}`
        : theme == "light"
        ? "whitesmoke"
        : "#333";
    return icons[i].svg.replace("<svg", `<svg fill="${fillColor}"`);
  });

  const scale = size / ICON_BOX_SIZE;

  const width = Math.min(perLine, slugs.length) * ICON_BOX_SIZE;
  const height = Math.ceil(slugs.length / perLine) * ICON_BOX_SIZE;
  const scaledHeight = height * scale;
  const scaledWidth = width * scale;

  const groups = iconSvgList
    .map((i, index) => {
      const tx = (index % perLine) * ICON_BOX_SIZE + PADDING;
      const ty = Math.floor(index / perLine) * ICON_BOX_SIZE + PADDING;
      return `<g transform="translate(${tx}, ${ty})">${i}</g>`;
    })
    .join(" ");

  return `<svg width="${scaledWidth}" height="${scaledHeight}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">${groups}</svg>
  `;
}

app.get(
  "/",
  (
    req: Request<
      {},
      {},
      {},
      { icons: string; perline?: string; theme?: string; size?: string }
    >,
    res: Response,
  ) => {
    const { icons, perline, theme, size } = req.query;

    let theme_parsed = "default";

    if (theme?.toLowerCase() == "light") theme_parsed = "light";
    else if (theme?.toLowerCase() == "dark") theme_parsed = "dark";

    const svg = generateSvg(
      icons.split(","),
      (perline && parseInt(perline)) || ICONS_PER_LINE,
      theme_parsed,
      (size && parseInt(size)) || ICON_SCALED_SIZE,
    );

    return res.setHeader("Content-Type", "image/svg+xml").send(svg);
  },
);

app.get("/icons", (_req, res) => {
  res
    .setHeader("Content-Type", "application/json")
    .send(JSON.stringify(Object.keys(icons)));
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});

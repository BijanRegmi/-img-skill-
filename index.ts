import { config } from "dotenv";
config();

import express, { Request, Response } from "express";
const app = express();

import morgan from "morgan";
app.use(morgan("tiny"));

import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
});
app.use(limiter);

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
    const icon = icons[i];
    if (!icon) return "";

    const fillColor =
      theme == "default"
        ? `#${icon.hex}`
        : theme == "light"
        ? "whitesmoke"
        : "#333";
    return icon.svg.replace("<svg", `<svg fill="${fillColor}"`);
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
      { icons?: string; perline?: string; theme?: string; size?: string }
    >,
    res: Response,
  ) => {
    const { icons, perline, theme, size } = req.query;

    const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;

    if (icons == undefined)
      return res.setHeader("Content-Type", "application/json").send({
        queries: {
          icons: {
            required: true,
            description:
              "List of icon slugs from https://simpleicons.org/ separated by comma",
          },
          perline: {
            required: false,
            description: "Number of icons to show per line",
            default: 15,
          },
          theme: {
            required: false,
            description:
              "Theme used for the icon. Can be either default, light or dark",
            default: "default",
          },
          size: {
            required: false,
            description: "Size of each icon",
            default: 48,
          },
        },
        example: `${fullUrl}?icons=javascript,css3,typescript,react&perline=3}`,
        moreInfo: "https://github.com/BijanRegmi/-img-skill-",
      });

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server started on port", port);
});

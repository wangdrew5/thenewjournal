import path from "node:path";
import sharp from "sharp";

const svg = (width, height, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`);
const paper = "#f4ecdc";
const ink = "#252d2a";
const accent = { poem: "#654b56", art: "#384c40", film: "#254552", song: "#824831" };

function markup(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Typeset within a fixed area, including long credits, without stretching short titles.
async function lettering(content, font, width, height, left, top, color = ink) {
  const text = { text: `<span foreground="${color}">${markup(content.trim() || "·")}</span>`, font, width, wrap: "word-char", rgba: true };
  const input = await sharp({ text }).png().toBuffer();
  const fitted = await sharp(input).resize({ width, height, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  return { input: fitted, left, top };
}

export async function buildShareCard(page, destination, poster, base) {
  const { piece, publication } = page;
  const field = accent[piece.type];
  const layers = [
    { input: svg(1200, 630, `<rect width="1200" height="630" fill="${paper}"/><rect x="673" width="527" height="630" fill="${field}"/><path d="M60 111H605M60 523H605" stroke="#b0a18b"/>`), top: 0, left: 0 },
    await lettering("The New Journal", "serif italic 44", 530, 56, 60, 41),
    await lettering(piece.title, "serif 70", 550, 177, 60, 175),
    await lettering(piece.author, "sans 27", 534, 109, 62, 378),
    await lettering(publication.caption + (publication.issueNumber ? "   /   Issue " + publication.issueNumber : ""), "sans 24", 540, 45, 62, 549),
  ];
  const image = piece.type === "art" ? piece.imageSrc : poster;
  if (image && image.startsWith(base)) {
    const root = path.resolve("dist");
    const file = path.resolve(root, image.slice(base.length));
    if (!file.startsWith(root + path.sep)) throw new Error("Invalid share image path");
    const mount = await sharp(file).resize(429, 443, { fit: "contain", background: "#e9e2d6" }).extend({ top: 12, left: 12, bottom: 24, right: 12, background: "#fffaf0" }).png().toBuffer();
    layers.push({ input: mount, top: 75, left: 710 });
  } else if (piece.type === "song") {
    const cassette = svg(460, 295, '<rect width="460" height="295" rx="20" fill="#242625"/><rect x="20" y="22" width="420" height="173" rx="8" fill="#eadbb7"/><path d="M20 47h420" stroke="#a6573b" stroke-width="19"/><rect x="77" y="121" width="306" height="56" rx="28" fill="#323733"/><g fill="#e4d8b9"><circle cx="115" cy="149" r="21"/><circle cx="345" cy="149" r="21"/></g><g fill="#323733"><circle cx="115" cy="149" r="9"/><circle cx="345" cy="149" r="9"/></g><path d="M75 291l23-66h264l23 66" fill="#484941"/>');
    layers.push({ input: cassette, top: 173, left: 708 }, await lettering(piece.title, "serif italic 34", 360, 42, 753, 242));
  } else {
    const excerpt = piece.type === "poem" ? piece.lines.slice(0, 4).join("\n") : piece.title;
    layers.push({ input: svg(402, 400, '<rect width="402" height="400" fill="#fff9e8"/><path d="M36 318h327" stroke="#b8ae93"/>'), top: 115, left: 735 },
      await lettering(excerpt, "serif italic 33", 330, 220, 771, 201),
      await lettering(({ poem: "Poem", film: "Film", art: "Artwork" })[piece.type], "sans 18", 330, 40, 772, 454));
  }
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: paper } }).composite(layers).jpeg({ quality: 88 }).toFile(destination);
}

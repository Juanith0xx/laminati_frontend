import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const targets = [
  {
    file: path.join(
      root,
      "src/app/productos/[slug]/ProductDetailClient.js"
    ),
    navClass:
      'className="mb-8 flex flex-wrap items-center gap-2 text-xs text-neutral-400"',
    navClassReplacement:
      'className="mb-4 flex flex-wrap items-center gap-2 text-xs text-neutral-400"',
    buttonMarkup: `
        <div className="mb-7">
          <ProductBackButton />
        </div>
`,
  },
  {
    file: path.join(
      root,
      "src/app/productos/[slug]/ProjectProductDetailClient.js"
    ),
    navClass:
      'className="flex flex-wrap items-center gap-2 text-xs text-neutral-400"',
    navClassReplacement:
      'className="flex flex-wrap items-center gap-2 text-xs text-neutral-400"',
    buttonMarkup: `
        <div className="mt-4">
          <ProductBackButton />
        </div>
`,
  },
];

const importLine =
  'import ProductBackButton from "./ProductBackButton";';

for (const target of targets) {
  if (!fs.existsSync(target.file)) {
    throw new Error(
      `No existe el archivo requerido: ${target.file}`
    );
  }

  let source =
    fs.readFileSync(
      target.file,
      "utf8"
    );

  const original =
    source;

  if (
    !source.includes(
      importLine
    )
  ) {
    const linkImport =
      'import Link from "next/link";';

    const linkIndex =
      source.indexOf(
        linkImport
      );

    if (
      linkIndex === -1
    ) {
      throw new Error(
        `No se encontró import Link en ${target.file}`
      );
    }

    const insertAt =
      linkIndex +
      linkImport.length;

    source =
      source.slice(
        0,
        insertAt
      ) +
      `\n\n${importLine}` +
      source.slice(
        insertAt
      );
  }

  if (
    source.includes(
      target.navClass
    ) &&
    target.navClass !==
      target.navClassReplacement
  ) {
    source =
      source.replace(
        target.navClass,
        target.navClassReplacement
      );
  }

  if (
    !source.includes(
      "<ProductBackButton />"
    )
  ) {
    const navStart =
      source.indexOf(
        target.navClassReplacement
      );

    if (
      navStart === -1
    ) {
      throw new Error(
        `No se encontró breadcrumb esperado en ${target.file}`
      );
    }

    const navEnd =
      source.indexOf(
        "</nav>",
        navStart
      );

    if (
      navEnd === -1
    ) {
      throw new Error(
        `No se encontró cierre </nav> en ${target.file}`
      );
    }

    const insertAt =
      navEnd +
      "</nav>".length;

    source =
      source.slice(
        0,
        insertAt
      ) +
      target.buttonMarkup +
      source.slice(
        insertAt
      );
  }

  if (
    source === original
  ) {
    console.log(
      `Sin cambios: ${path.relative(root, target.file)}`
    );
    continue;
  }

  const backup =
    `${target.file}.before-back-button.bak`;

  if (
    !fs.existsSync(
      backup
    )
  ) {
    fs.writeFileSync(
      backup,
      original,
      "utf8"
    );
  }

  fs.writeFileSync(
    target.file,
    source,
    "utf8"
  );

  console.log(
    `Actualizado: ${path.relative(root, target.file)}`
  );
}

console.log("");
console.log("Botón Volver aplicado correctamente.");
console.log("Archivos .bak creados como respaldo.");

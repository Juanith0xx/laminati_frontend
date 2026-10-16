"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";

import {
  apiRequest,
} from "@/services/api";

const ACCEPTED_EXTENSIONS =
  /\.(jpe?g|png|webp|avif)$/i;

const MAX_PARALLEL_UPLOADS = 3;

/* =========================================
   NORMALIZAR TEXTO
========================================= */
function normalizeValue(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}

/* =========================================
   NOMBRE LIMPIO
========================================= */
function cleanProductName(
  product
) {
  return String(
    product?.name || ""
  )
    .split("|")[0]
    .trim();
}


/* =========================================
   URL DE IMAGEN GUARDADA
========================================= */
function getSavedImageUrl(
  image
) {
  return (
    image?.card_url ||
    image?.detail_url ||
    image?.thumbnail_url ||
    image?.image_url ||
    null
  );
}

/* =========================================
   ID LOCAL DE ARCHIVO
========================================= */
function makeLocalFileId(
  file
) {
  return [
    file.name,
    file.size,
    file.lastModified,
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}


/* =========================================
   TIPO DE IMAGEN POR NOMBRE DE ARCHIVO

   Convención recomendada:
   *_sample.* / *_muestra.* = principal
   *_panel.*                 = secundaria
========================================= */
function getImageRole(
  fileName = ""
) {
  const normalizedName =
    normalizeValue(
      String(fileName)
        .replace(
          /\.[^.]+$/,
          ""
        )
    );

  if (
    normalizedName.includes(
      "sample"
    ) ||
    normalizedName.includes(
      "muestra"
    ) ||
    normalizedName.includes(
      "swatch"
    )
  ) {
    return "sample";
  }

  if (
    normalizedName.includes(
      "panel"
    )
  ) {
    return "panel";
  }

  return "gallery";
}

function getImageRolePriority(
  fileName = ""
) {
  const role =
    getImageRole(
      fileName
    );

  if (role === "sample") {
    return 0;
  }

  if (role === "panel") {
    return 1;
  }

  return 2;
}

/* =========================================
   ORDEN DE ARCHIVOS
   SKU.jpg queda antes de SKU_2.jpg
========================================= */
function sortFilesForProduct(
  product,
  entries
) {
  const normalizedSku =
    normalizeValue(
      product?.sku
    );

  return [...entries].sort(
    (a, b) => {
      const aRolePriority =
        getImageRolePriority(
          a.file.name
        );

      const bRolePriority =
        getImageRolePriority(
          b.file.name
        );

      /*
       * La muestra/sample siempre va primero.
       * La imagen panel queda segunda.
       * El resto queda después.
       */
      if (
        aRolePriority !==
        bRolePriority
      ) {
        return (
          aRolePriority -
          bRolePriority
        );
      }

      const aStem =
        normalizeValue(
          a.file.name.replace(
            /\.[^.]+$/,
            ""
          )
        );

      const bStem =
        normalizeValue(
          b.file.name.replace(
            /\.[^.]+$/,
            ""
          )
        );

      const aExact =
        aStem ===
        normalizedSku;

      const bExact =
        bStem ===
        normalizedSku;

      if (
        aExact !== bExact
      ) {
        return aExact
          ? -1
          : 1;
      }

      return a.file.name
        .localeCompare(
          b.file.name,
          "es",
          {
            numeric: true,
            sensitivity:
              "base",
          }
        );
    }
  );
}

/* =========================================
   ADMIN PRODUCT IMAGE PAGE
========================================= */
export default function AdminProductImagesPage() {
  const router =
    useRouter();

  const bulkInputRef =
    useRef(null);

  const objectUrlsRef =
    useRef(
      new Set()
    );

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(true);

  const [
    pageError,
    setPageError,
  ] = useState("");

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    brands,
    setBrands,
  ] = useState([]);

  const [
    collections,
    setCollections,
  ] = useState([]);

  const [
    selectedBrandId,
    setSelectedBrandId,
  ] = useState("");

  const [
    selectedCollectionId,
    setSelectedCollectionId,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    fileSelections,
    setFileSelections,
  ] = useState({});

  const [
    unmatchedFiles,
    setUnmatchedFiles,
  ] = useState([]);

  const [
    bulkMessage,
    setBulkMessage,
  ] = useState("");

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    makeFirstPrimary,
    setMakeFirstPrimary,
  ] = useState(true);


  const [
    imageManagerOpen,
    setImageManagerOpen,
  ] = useState(false);

  const [
    managedProduct,
    setManagedProduct,
  ] = useState(null);

  const [
    managedImages,
    setManagedImages,
  ] = useState([]);

  const [
    managedImagesLoading,
    setManagedImagesLoading,
  ] = useState(false);

  const [
    managedImagesError,
    setManagedImagesError,
  ] = useState("");

  const [
    managedImagesMessage,
    setManagedImagesMessage,
  ] = useState("");

  const [
    managedImagesMessageType,
    setManagedImagesMessageType,
  ] = useState("success");

  const [
    deleteImageTarget,
    setDeleteImageTarget,
  ] = useState(null);

  const [
    isDeletingSavedImage,
    setIsDeletingSavedImage,
  ] = useState(false);


  const [
    primaryImageUpdatingId,
    setPrimaryImageUpdatingId,
  ] = useState(null);

  /* =========================================
     LIMPIAR OBJECT URLS AL SALIR
  ========================================= */
  useEffect(() => {
    return () => {
      objectUrlsRef
        .current
        .forEach(
          (url) =>
            URL.revokeObjectURL(
              url
            )
        );

      objectUrlsRef
        .current
        .clear();
    };
  }, []);

  /* =========================================
     AUTENTICACIÓN ADMIN
  ========================================= */
  useEffect(() => {
    let active = true;

    const validateSession =
      async () => {
        try {
          const response =
            await apiRequest(
              "/auth/me"
            );

          if (
            !response?.success ||
            response?.user?.role !==
              "ADMIN"
          ) {
            throw new Error(
              "Acceso administrativo requerido"
            );
          }

          if (active) {
            setAuthLoading(
              false
            );
          }
        } catch (error) {
          console.error(
            "Error validando sesión administrativa:",
            error
          );

          if (
            typeof window !==
            "undefined"
          ) {
            localStorage.removeItem(
              "token"
            );

            localStorage.removeItem(
              "user"
            );
          }

          router.replace(
            "/login"
          );
        }
      };

    validateSession();

    return () => {
      active = false;
    };
  }, [
    router,
  ]);

  /* =========================================
     CARGAR CATÁLOGO ADMIN
  ========================================= */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    let active = true;

    const loadData =
      async () => {
        try {
          setCatalogLoading(
            true
          );

          setPageError("");

          const [
            productsResponse,
            brandsResponse,
            collectionsResponse,
          ] =
            await Promise.all([
              apiRequest(
                "/admin/products"
              ),
              apiRequest(
                "/admin/brands"
              ),
              apiRequest(
                "/admin/collections"
              ),
            ]);

          if (!active) {
            return;
          }

          const loadedProducts =
            Array.isArray(
              productsResponse
                ?.products
            )
              ? productsResponse
                  .products
              : [];

          const loadedBrands =
            Array.isArray(
              brandsResponse
                ?.brands
            )
              ? brandsResponse
                  .brands
              : [];

          const loadedCollections =
            Array.isArray(
              collectionsResponse
                ?.collections
            )
              ? collectionsResponse
                  .collections
              : [];

          setProducts(
            loadedProducts
          );

          setBrands(
            loadedBrands
          );

          setCollections(
            loadedCollections
          );

          const karikal =
            loadedBrands.find(
              (brand) =>
                brand.slug ===
                "karikal"
            );

          const firstBrand =
            karikal ||
            loadedBrands[0] ||
            null;

          if (firstBrand) {
            setSelectedBrandId(
              firstBrand.id
            );

            const firstCollection =
              loadedCollections.find(
                (
                  collection
                ) =>
                  collection
                    .brand_id ===
                  firstBrand.id
              );

            if (
              firstCollection
            ) {
              setSelectedCollectionId(
                firstCollection.id
              );
            }
          }
        } catch (error) {
          console.error(
            "Error cargando catálogo administrativo:",
            error
          );

          if (
            error?.status ===
              401 ||
            error?.status ===
              403
          ) {
            router.replace(
              "/login"
            );

            return;
          }

          if (active) {
            setPageError(
              error?.message ||
                "No fue posible cargar el catálogo."
            );
          }
        } finally {
          if (active) {
            setCatalogLoading(
              false
            );
          }
        }
      };

    loadData();

    return () => {
      active = false;
    };
  }, [
    authLoading,
    router,
  ]);

  /* =========================================
     COLECCIONES DE LA MARCA
  ========================================= */
  const brandCollections =
    useMemo(() => {
      if (
        !selectedBrandId
      ) {
        return [];
      }

      return collections
        .filter(
          (
            collection
          ) =>
            collection.brand_id ===
            selectedBrandId
        )
        .sort(
          (a, b) =>
            Number(
              a.sort_order || 0
            ) -
              Number(
                b.sort_order || 0
              ) ||
            a.name.localeCompare(
              b.name,
              "es"
            )
        );
    }, [
      collections,
      selectedBrandId,
    ]);

  /* =========================================
     PRODUCTOS DE LA COLECCIÓN
  ========================================= */
  const collectionProducts =
    useMemo(() => {
      if (
        !selectedCollectionId
      ) {
        return [];
      }

      return products
        .filter(
          (product) =>
            product.collection_id ===
            selectedCollectionId
        )
        .sort(
          (a, b) =>
            String(
              a.internal_code ||
                a.sku ||
                ""
            ).localeCompare(
              String(
                b.internal_code ||
                  b.sku ||
                  ""
              ),
              "es",
              {
                numeric: true,
              }
            )
        );
    }, [
      products,
      selectedCollectionId,
    ]);

  /* =========================================
     PRODUCTOS VISIBLES
  ========================================= */
  const visibleProducts =
    useMemo(() => {
      const normalizedSearch =
        normalizeValue(
          search
        );

      if (
        !normalizedSearch
      ) {
        return collectionProducts;
      }

      return collectionProducts.filter(
        (product) => {
          const haystack =
            normalizeValue(
              [
                product.sku,
                product.internal_code,
                product.name,
              ].join(" ")
            );

          return haystack.includes(
            normalizedSearch
          );
        }
      );
    }, [
      collectionProducts,
      search,
    ]);

  /* =========================================
     RESUMEN DE SELECCIÓN
  ========================================= */
  const selectedFilesCount =
    useMemo(
      () =>
        Object.values(
          fileSelections
        ).reduce(
          (
            total,
            entries
          ) =>
            total +
            entries.length,
          0
        ),
      [
        fileSelections,
      ]
    );

  const selectedProductsCount =
    useMemo(
      () =>
        Object.values(
          fileSelections
        ).filter(
          (entries) =>
            entries.length > 0
        ).length,
      [
        fileSelections,
      ]
    );

  const successfulFilesCount =
    useMemo(
      () =>
        Object.values(
          fileSelections
        ).reduce(
          (
            total,
            entries
          ) =>
            total +
            entries.filter(
              (entry) =>
                entry.status ===
                "success"
            ).length,
          0
        ),
      [
        fileSelections,
      ]
    );

  /* =========================================
     CAMBIAR MARCA
  ========================================= */
  const handleBrandChange =
    (event) => {
      const brandId =
        event.target.value;

      setSelectedBrandId(
        brandId
      );

      setSearch("");

      setBulkMessage("");

      setUnmatchedFiles(
        []
      );

      const nextCollection =
        collections.find(
          (
            collection
          ) =>
            collection.brand_id ===
            brandId
        );

      setSelectedCollectionId(
        nextCollection?.id ||
          ""
      );
    };

  /* =========================================
     CAMBIAR COLECCIÓN
  ========================================= */
  const handleCollectionChange =
    (event) => {
      setSelectedCollectionId(
        event.target.value
      );

      setSearch("");

      setBulkMessage("");

      setUnmatchedFiles(
        []
      );
    };

  /* =========================================
     CREAR ENTRADA LOCAL
  ========================================= */
  const createFileEntry =
    (file) => {
      const previewUrl =
        URL.createObjectURL(
          file
        );

      objectUrlsRef
        .current
        .add(
          previewUrl
        );

      return {
        id:
          makeLocalFileId(
            file
          ),

        file,

        previewUrl,

        status:
          "ready",

        error: "",

        response: null,
      };
    };

  /* =========================================
     AGREGAR ARCHIVOS A PRODUCTO
  ========================================= */
  const appendFilesToProduct =
    (
      product,
      files
    ) => {
      const validFiles =
        Array.from(files)
          .filter(
            (file) =>
              ACCEPTED_EXTENSIONS.test(
                file.name
              )
          );

      if (
        validFiles.length === 0
      ) {
        return;
      }

      setFileSelections(
        (current) => {
          const existing =
            current[
              product.id
            ] || [];

          const existingKeys =
            new Set(
              existing.map(
                (entry) =>
                  `${entry.file.name}-${entry.file.size}-${entry.file.lastModified}`
              )
            );

          const additions =
            validFiles
              .filter(
                (file) =>
                  !existingKeys.has(
                    `${file.name}-${file.size}-${file.lastModified}`
                  )
              )
              .map(
                createFileEntry
              );

          return {
            ...current,

            [product.id]:
              sortFilesForProduct(
                product,
                [
                  ...existing,
                  ...additions,
                ]
              ),
          };
        }
      );
    };

  /* =========================================
     CARGA MASIVA POR SKU
  ========================================= */
  const assignBulkFiles =
    (fileList) => {
      setBulkMessage("");

      if (
        !selectedCollectionId
      ) {
        setBulkMessage(
          "Selecciona primero una colección."
        );

        return;
      }

      const files =
        Array.from(
          fileList || []
        ).filter(
          (file) =>
            ACCEPTED_EXTENSIONS.test(
              file.name
            )
        );

      if (
        files.length === 0
      ) {
        setBulkMessage(
          "No se encontraron imágenes compatibles."
        );

        return;
      }

      const candidates =
        [...collectionProducts]
          .sort(
            (a, b) =>
              String(
                b.sku || ""
              ).length -
              String(
                a.sku || ""
              ).length
          );

      const grouped =
        new Map();

      const unmatched = [];

      files.forEach(
        (file) => {
          const stem =
            file.name.replace(
              /\.[^.]+$/,
              ""
            );

          const normalizedStem =
            normalizeValue(
              stem
            );

          const product =
            candidates.find(
              (
                candidate
              ) => {
                const sku =
                  normalizeValue(
                    candidate.sku
                  );

                return (
                  sku &&
                  (
                    normalizedStem ===
                      sku ||
                    normalizedStem.startsWith(
                      sku
                    )
                  )
                );
              }
            );

          if (!product) {
            unmatched.push(
              file.name
            );

            return;
          }

          const current =
            grouped.get(
              product.id
            ) || [];

          current.push(
            file
          );

          grouped.set(
            product.id,
            current
          );
        }
      );

      grouped.forEach(
        (
          groupedFiles,
          productId
        ) => {
          const product =
            collectionProducts.find(
              (
                item
              ) =>
                item.id ===
                productId
            );

          if (product) {
            appendFilesToProduct(
              product,
              groupedFiles
            );
          }
        }
      );

      setUnmatchedFiles(
        unmatched
      );

      const matchedCount =
        files.length -
        unmatched.length;

      setBulkMessage(
        matchedCount > 0
          ? `${matchedCount} imagen${matchedCount === 1 ? "" : "es"} asociada${matchedCount === 1 ? "" : "s"} automáticamente por SKU.`
          : "No se pudo asociar ninguna imagen con los SKU de esta colección."
      );

      if (
        bulkInputRef.current
      ) {
        bulkInputRef.current.value =
          "";
      }
    };

  /* =========================================
     ELIMINAR ARCHIVO LOCAL
  ========================================= */
  const removeEntry =
    (
      productId,
      entryId
    ) => {
      setFileSelections(
        (current) => {
          const currentEntries =
            current[
              productId
            ] || [];

          const removed =
            currentEntries.find(
              (entry) =>
                entry.id ===
                entryId
            );

          if (
            removed?.previewUrl
          ) {
            URL.revokeObjectURL(
              removed.previewUrl
            );

            objectUrlsRef
              .current
              .delete(
                removed.previewUrl
              );
          }

          const nextEntries =
            currentEntries.filter(
              (entry) =>
                entry.id !==
                entryId
            );

          const next = {
            ...current,
          };

          if (
            nextEntries.length ===
            0
          ) {
            delete next[
              productId
            ];
          } else {
            next[
              productId
            ] =
              nextEntries;
          }

          return next;
        }
      );
    };

  /* =========================================
     ACTUALIZAR ESTADO DE ARCHIVO
  ========================================= */
  const updateEntry =
    (
      productId,
      entryId,
      patch
    ) => {
      setFileSelections(
        (current) => ({
          ...current,

          [productId]:
            (
              current[
                productId
              ] || []
            ).map(
              (entry) =>
                entry.id ===
                entryId
                  ? {
                      ...entry,
                      ...patch,
                    }
                  : entry
            ),
        })
      );
    };

  /* =========================================
     SUBIR UNA IMAGEN
  ========================================= */
  const uploadOne =
    async ({
      product,
      entry,
      index,
    }) => {
      updateEntry(
        product.id,
        entry.id,
        {
          status:
            "uploading",
          error: "",
        }
      );

      try {
        const formData =
          new FormData();

        formData.append(
          "image",
          entry.file
        );

        const imageRole =
          getImageRole(
            entry.file.name
          );

        const hasStoredImage =
          Boolean(
            product
              ?.primary_image_url ||
            product
              ?.has_image
          );

        /*
         * REGLA DE ORDEN:
         *
         * SAMPLE / MUESTRA
         * - siempre puede convertirse en principal.
         *
         * PANEL
         * - nunca reemplaza una imagen principal
         *   ya guardada.
         *
         * GALERÍA
         * - sólo puede quedar principal cuando
         *   el producto todavía no tiene imágenes
         *   y es el primer archivo seleccionado.
         */
        const shouldBePrimary =
          imageRole ===
          "sample"
            ? true
            : imageRole ===
              "panel"
              ? false
              : (
                  makeFirstPrimary &&
                  !hasStoredImage &&
                  index === 0
                );

        formData.append(
          "image_type",
          imageRole
        );

        formData.append(
          "alt_text",
          cleanProductName(
            product
          )
        );

        formData.append(
          "is_primary",
          shouldBePrimary
            ? "true"
            : "false"
        );

        formData.append(
          "sort_order",
          String(
            imageRole ===
            "sample"
              ? 0
              : imageRole ===
                "panel"
                ? 1
                : index + 2
          )
        );

        const response =
          await apiRequest(
            `/admin/products/${product.id}/images`,
            {
              method:
                "POST",

              body:
                formData,
            }
          );

        updateEntry(
          product.id,
          entry.id,
          {
            status:
              "success",

            error: "",

            response,
          }
        );

        if (
          response?.image
            ?.is_primary &&
          response?.urls
            ?.card
        ) {
          setProducts(
            (
              currentProducts
            ) =>
              currentProducts.map(
                (
                  currentProduct
                ) =>
                  currentProduct.id ===
                  product.id
                    ? {
                        ...currentProduct,
                        primary_image_url:
                          response
                            .urls
                            .card,
                      }
                    : currentProduct
              )
          );
        }

        return {
          success: true,
        };
      } catch (error) {
        console.error(
          `Error subiendo ${entry.file.name}:`,
          error
        );

        updateEntry(
          product.id,
          entry.id,
          {
            status:
              "error",

            error:
              error?.message ||
              "No fue posible subir la imagen",
          }
        );

        if (
          error?.status ===
            401 ||
          error?.status ===
            403
        ) {
          router.replace(
            "/login"
          );
        }

        return {
          success: false,
        };
      }
    };

  /* =========================================
     EJECUTAR COLA CONCURRENTE
  ========================================= */
  const runUploadQueue =
    async (
      tasks
    ) => {
      if (
        tasks.length === 0
      ) {
        setBulkMessage(
          "No hay imágenes pendientes para subir."
        );

        return;
      }

      setIsUploading(
        true
      );

      setBulkMessage(
        `Subiendo ${tasks.length} imagen${tasks.length === 1 ? "" : "es"}...`
      );

      let cursor = 0;

      let success = 0;

      const worker =
        async () => {
          while (
            cursor <
            tasks.length
          ) {
            const taskIndex =
              cursor;

            cursor += 1;

            const result =
              await uploadOne(
                tasks[
                  taskIndex
                ]
              );

            if (
              result.success
            ) {
              success += 1;
            }
          }
        };

      try {
        const workers =
          Array.from(
            {
              length:
                Math.min(
                  MAX_PARALLEL_UPLOADS,
                  tasks.length
                ),
            },
            () =>
              worker()
          );

        await Promise.all(
          workers
        );

        const failed =
          tasks.length -
          success;

        setBulkMessage(
          failed === 0
            ? `Carga terminada: ${success} imagen${success === 1 ? "" : "es"} subida${success === 1 ? "" : "s"} correctamente.`
            : `Carga terminada: ${success} correcta${success === 1 ? "" : "s"} y ${failed} con error.`
        );
      } finally {
        setIsUploading(
          false
        );
      }
    };

  /* =========================================
     SUBIR TODA LA SELECCIÓN
  ========================================= */
  const uploadAllSelected =
    async () => {
      const tasks = [];

      collectionProducts.forEach(
        (product) => {
          const entries =
            sortFilesForProduct(
              product,
              fileSelections[
                product.id
              ] || []
            );

          entries.forEach(
            (
              entry,
              index
            ) => {
              if (
                entry.status !==
                "success"
              ) {
                tasks.push({
                  product,
                  entry,
                  index,
                });
              }
            }
          );
        }
      );

      await runUploadQueue(
        tasks
      );
    };

  /* =========================================
     SUBIR UN PRODUCTO
  ========================================= */
  const uploadProduct =
    async (
      product
    ) => {
      const entries =
        sortFilesForProduct(
          product,
          fileSelections[
            product.id
          ] || []
        );

      const tasks =
        entries
          .map(
            (
              entry,
              index
            ) => ({
              product,
              entry,
              index,
            })
          )
          .filter(
            (task) =>
              task.entry
                .status !==
              "success"
          );

      await runUploadQueue(
        tasks
      );
    };

  /* =========================================
     LIMPIAR SELECCIÓN
  ========================================= */
  const clearSelections =
    () => {
      Object.values(
        fileSelections
      )
        .flat()
        .forEach(
          (entry) => {
            if (
              entry.previewUrl
            ) {
              URL.revokeObjectURL(
                entry.previewUrl
              );

              objectUrlsRef
                .current
                .delete(
                  entry.previewUrl
                );
            }
          }
        );

      setFileSelections(
        {}
      );

      setUnmatchedFiles(
        []
      );

      setBulkMessage("");
    };

  /* =========================================
     SINCRONIZAR IMAGEN PRINCIPAL EN TARJETA
  ========================================= */
  const syncManagedPrimaryImage =
    (
      productId,
      images
    ) => {
      const primaryImage =
        images.find(
          (image) =>
            image.is_primary
        ) ||
        images[0] ||
        null;

      const primaryUrl =
        getSavedImageUrl(
          primaryImage
        );

      setProducts(
        (
          currentProducts
        ) =>
          currentProducts.map(
            (
              currentProduct
            ) =>
              currentProduct.id ===
              productId
                ? {
                    ...currentProduct,
                    primary_image_url:
                      primaryUrl,
                  }
                : currentProduct
          )
      );
    };

  /* =========================================
     CARGAR IMÁGENES GUARDADAS
  ========================================= */
  const refreshManagedImages =
    async (
      product,
      {
        showLoading = true,
      } = {}
    ) => {
      if (!product?.id) {
        return [];
      }

      if (showLoading) {
        setManagedImagesLoading(
          true
        );
      }

      setManagedImagesError(
        ""
      );

      try {
        const response =
          await apiRequest(
            `/admin/products/${product.id}/images`
          );

        const images =
          Array.isArray(
            response?.images
          )
            ? response.images
            : [];

        setManagedImages(
          images
        );

        syncManagedPrimaryImage(
          product.id,
          images
        );

        return images;
      } catch (error) {
        console.error(
          "Error cargando imágenes guardadas:",
          error
        );

        if (
          error?.status ===
            401 ||
          error?.status ===
            403
        ) {
          router.replace(
            "/login"
          );

          return [];
        }

        setManagedImagesError(
          error?.message ||
            "No fue posible cargar las imágenes guardadas."
        );

        return [];
      } finally {
        if (showLoading) {
          setManagedImagesLoading(
            false
          );
        }
      }
    };

  /* =========================================
     ABRIR GESTOR DE IMÁGENES
  ========================================= */
  const openImageManager =
    async (
      product
    ) => {
      setManagedProduct(
        product
      );

      setManagedImages(
        []
      );

      setManagedImagesError(
        ""
      );

      setManagedImagesMessage(
        ""
      );

      setManagedImagesMessageType(
        "success"
      );

      setDeleteImageTarget(
        null
      );

      setImageManagerOpen(
        true
      );

      await refreshManagedImages(
        product
      );
    };

  /* =========================================
     CERRAR GESTOR
  ========================================= */
  const closeImageManager =
    () => {
      if (
        isDeletingSavedImage ||
        primaryImageUpdatingId
      ) {
        return;
      }

      setImageManagerOpen(
        false
      );

      setManagedProduct(
        null
      );

      setManagedImages(
        []
      );

      setManagedImagesError(
        ""
      );

      setManagedImagesMessage(
        ""
      );

      setDeleteImageTarget(
        null
      );
    };

  /* =========================================
     SELECCIONAR IMAGEN PRINCIPAL
  ========================================= */
  const setManagedImageAsPrimary =
    async (
      image
    ) => {
      if (
        !managedProduct?.id ||
        !image?.id ||
        image.is_primary
      ) {
        return;
      }

      try {
        setPrimaryImageUpdatingId(
          image.id
        );

        setManagedImagesError(
          ""
        );

        setManagedImagesMessage(
          ""
        );

        await apiRequest(
          `/admin/products/${managedProduct.id}/images/${image.id}`,
          {
            method:
              "PATCH",

            body: {
              is_primary:
                true,
            },
          }
        );

        await refreshManagedImages(
          managedProduct,
          {
            showLoading:
              false,
          }
        );

        setManagedImagesMessageType(
          "success"
        );

        setManagedImagesMessage(
          "Imagen principal actualizada correctamente."
        );
      } catch (error) {
        console.error(
          "Error seleccionando imagen principal:",
          error
        );

        if (
          error?.status ===
            401 ||
          error?.status ===
            403
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        setManagedImagesError(
          error?.message ||
            "No fue posible establecer la imagen principal."
        );
      } finally {
        setPrimaryImageUpdatingId(
          null
        );
      }
    };

  /* =========================================
     CONFIRMAR ELIMINACIÓN
  ========================================= */
  const confirmDeleteSavedImage =
    async () => {
      if (
        !managedProduct?.id ||
        !deleteImageTarget?.id
      ) {
        return;
      }

      try {
        setIsDeletingSavedImage(
          true
        );

        setManagedImagesError(
          ""
        );

        setManagedImagesMessage(
          ""
        );

        const response =
          await apiRequest(
            `/admin/products/${managedProduct.id}/images/${deleteImageTarget.id}`,
            {
              method:
                "DELETE",
            }
          );

        setDeleteImageTarget(
          null
        );

        await refreshManagedImages(
          managedProduct,
          {
            showLoading:
              false,
          }
        );

        const hasStorageWarning =
          response
            ?.storage_cleanup
            ?.attempted ===
            true &&
          response
            ?.storage_cleanup
            ?.success ===
            false;

        setManagedImagesMessageType(
          hasStorageWarning
            ? "warning"
            : "success"
        );

        setManagedImagesMessage(
          response?.warning ||
            response?.message ||
            "Imagen eliminada correctamente."
        );
      } catch (error) {
        console.error(
          "Error eliminando imagen guardada:",
          error
        );

        if (
          error?.status ===
            401 ||
          error?.status ===
            403
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        setManagedImagesError(
          error?.message ||
            "No fue posible eliminar la imagen."
        );
      } finally {
        setIsDeletingSavedImage(
          false
        );
      }
    };

  /* =========================================
     LOGOUT
  ========================================= */
  const handleLogout =
    () => {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      router.replace(
        "/login"
      );
    };

  const selectedBrand =
    brands.find(
      (brand) =>
        brand.id ===
        selectedBrandId
    ) || null;

  const selectedCollection =
    collections.find(
      (collection) =>
        collection.id ===
        selectedCollectionId
    ) || null;

  /* =========================================
     LOADING
  ========================================= */
  if (
    authLoading ||
    catalogLoading
  ) {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-[#f5f4f1] px-5 py-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-20 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Laminati
            </p>

            <p className="mt-4 text-sm text-neutral-600">
              Cargando panel administrativo...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f5f4f1] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1500px]">

        <header className="flex flex-col gap-6 rounded-[2rem] border border-black/5 bg-white px-6 py-7 shadow-sm sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
              Administración
            </p>

            <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-neutral-950 sm:text-4xl">
              Carga rápida de imágenes
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
              Selecciona una marca y colección. Puedes cargar imágenes individualmente o elegir varios archivos y relacionarlos automáticamente usando el SKU en el nombre.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/admin/pagos"
              className="flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-black"
            >
              Pagos y transferencias
            </Link>

            <Link
              href="/"
              className="flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-black"
            >
              Ver tienda
            </Link>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex h-11 items-center justify-center rounded-full bg-black px-5 text-xs font-medium text-white transition hover:bg-neutral-800"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {pageError && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <section className="mt-6 rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr]">

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Marca
              </label>

              <select
                value={
                  selectedBrandId
                }
                onChange={
                  handleBrandChange
                }
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-black"
              >
                <option value="">
                  Seleccionar marca
                </option>

                {brands.map(
                  (brand) => (
                    <option
                      key={
                        brand.id
                      }
                      value={
                        brand.id
                      }
                    >
                      {
                        brand.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Colección
              </label>

              <select
                value={
                  selectedCollectionId
                }
                onChange={
                  handleCollectionChange
                }
                disabled={
                  !selectedBrandId
                }
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
              >
                <option value="">
                  Seleccionar colección
                </option>

                {brandCollections.map(
                  (
                    collection
                  ) => (
                    <option
                      key={
                        collection.id
                      }
                      value={
                        collection.id
                      }
                    >
                      {
                        collection.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Buscar producto
              </label>

              <div className="relative">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />

                  <path
                    d="M16.5 16.5L21 21"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                  }
                  type="search"
                  placeholder="SKU o nombre..."
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-300 focus:border-black"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-neutral-100 pt-5 text-xs text-neutral-500">
            <span>
              <strong className="font-semibold text-neutral-950">
                {
                  collectionProducts.length
                }
              </strong>{" "}
              productos
            </span>

            <span>
              <strong className="font-semibold text-neutral-950">
                {
                  selectedProductsCount
                }
              </strong>{" "}
              con selección
            </span>

            <span>
              <strong className="font-semibold text-neutral-950">
                {
                  selectedFilesCount
                }
              </strong>{" "}
              imágenes preparadas
            </span>

            {successfulFilesCount >
              0 && (
              <span className="text-emerald-700">
                <strong className="font-semibold">
                  {
                    successfulFilesCount
                  }
                </strong>{" "}
                subidas
              </span>
            )}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            <div className="bg-black px-6 py-8 text-white sm:px-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Carga masiva
              </p>

              <h2 className="mt-3 text-2xl font-medium tracking-[-0.035em]">
                Nombra los archivos con el SKU.
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-6 text-white/55">
                Usa *_sample.jpg o *_muestra.jpg para la imagen principal y *_panel.jpg para la segunda imagen. Las imágenes de panel ya no reemplazarán una muestra principal existente.
              </p>

              <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4 font-mono text-xs leading-7 text-white/65">
                <div>
                  5052M.jpg
                </div>

                <div>
                  5071M.jpg
                </div>

                <div>
                  5080M.jpg
                </div>

                <div>
                  5095M.jpg
                </div>

                <div>
                  5017M.jpg
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <input
                ref={
                  bulkInputRef
                }
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(
                  event
                ) =>
                  assignBulkFiles(
                    event
                      .target
                      .files
                  )
                }
              />

              <button
                type="button"
                disabled={
                  !selectedCollectionId
                }
                onClick={() =>
                  bulkInputRef
                    .current
                    ?.click()
                }
                onDragOver={(
                  event
                ) => {
                  event.preventDefault();
                }}
                onDrop={(
                  event
                ) => {
                  event.preventDefault();

                  assignBulkFiles(
                    event.dataTransfer
                      .files
                  );
                }}
                className="flex min-h-[190px] w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center transition hover:border-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 16V4M7.5 8.5 12 4l4.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M5 13v6h14v-6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <span className="mt-4 text-sm font-medium text-neutral-950">
                  Seleccionar varias imágenes
                </span>

                <span className="mt-2 text-xs leading-5 text-neutral-400">
                  o arrástralas aquí · JPG, PNG, WEBP o AVIF
                </span>
              </button>

              {bulkMessage && (
                <p className="mt-4 text-xs font-medium leading-5 text-neutral-600">
                  {bulkMessage}
                </p>
              )}

              {unmatchedFiles.length >
                0 && (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-800">
                    No fue posible asociar:
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    {
                      unmatchedFiles.join(
                        ", "
                      )
                    }
                  </p>
                </div>
              )}

              <label className="mt-5 flex cursor-pointer items-center gap-3 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={
                    makeFirstPrimary
                  }
                  onChange={(
                    event
                  ) =>
                    setMakeFirstPrimary(
                      event
                        .target
                        .checked
                    )
                  }
                  className="h-4 w-4 accent-black"
                />

                Si no existe una imagen principal, la primera imagen genérica podrá quedar como principal
              </label>
            </div>
          </div>
        </section>

        <div className="sticky bottom-4 z-20 mt-6 rounded-[1.5rem] border border-black/10 bg-white/95 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-950">
              {selectedCollection
                ? `${selectedBrand?.name || ""} · ${selectedCollection.name}`
                : "Selecciona una colección"}
            </p>

            <p className="mt-1 text-xs text-neutral-400">
              {
                selectedFilesCount
              }{" "}
              imagen
              {
                selectedFilesCount ===
                1
                  ? ""
                  : "es"
              }{" "}
              seleccionada
              {
                selectedFilesCount ===
                1
                  ? ""
                  : "s"
              }
            </p>
          </div>

          <div className="mt-4 flex gap-2 sm:mt-0">
            <button
              type="button"
              disabled={
                isUploading ||
                selectedFilesCount ===
                  0
              }
              onClick={
                clearSelections
              }
              className="h-11 rounded-full border border-black/10 px-5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Limpiar
            </button>

            <button
              type="button"
              disabled={
                isUploading ||
                selectedFilesCount ===
                  0
              }
              onClick={
                uploadAllSelected
              }
              className="h-11 min-w-[170px] rounded-full bg-black px-6 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploading
                ? "Subiendo..."
                : `Subir ${selectedFilesCount || ""} imagen${selectedFilesCount === 1 ? "" : "es"}`}
            </button>
          </div>
        </div>

        <section className="mt-6">
          {!selectedCollectionId ? (
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-sm font-medium text-neutral-700">
                Selecciona una marca y una colección.
              </p>
            </div>
          ) : visibleProducts.length ===
            0 ? (
            <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-sm font-medium text-neutral-700">
                No hay productos para mostrar.
              </p>

              <p className="mt-2 text-xs text-neutral-400">
                Si la colección acaba de crearse, primero importa o asigna sus productos.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map(
                (product) => {
                  const entries =
                    sortFilesForProduct(
                      product,
                      fileSelections[
                        product.id
                      ] || []
                    );

                  const mainEntry =
                    entries[0] ||
                    null;

                  const previewUrl =
                    mainEntry
                      ?.response
                      ?.urls
                      ?.card ||
                    mainEntry
                      ?.previewUrl ||
                    product
                      .primary_image_url ||
                    null;

                  const hasError =
                    entries.some(
                      (entry) =>
                        entry.status ===
                        "error"
                    );

                  const uploading =
                    entries.some(
                      (entry) =>
                        entry.status ===
                        "uploading"
                    );

                  const allSuccess =
                    entries.length >
                      0 &&
                    entries.every(
                      (entry) =>
                        entry.status ===
                        "success"
                    );

                  return (
                    <article
                      key={
                        product.id
                      }
                      className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-sm"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f2ee]">
                        {previewUrl ? (
                          <img
                            src={
                              previewUrl
                            }
                            alt={
                              cleanProductName(
                                product
                              )
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-center">
                            <div>
                              <p className="text-xs font-semibold tracking-[0.18em] text-neutral-400">
                                LAMINATI
                              </p>

                              <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-neutral-300">
                                Sin imagen
                              </p>
                            </div>
                          </div>
                        )}

                        {entries.length >
                          0 && (
                          <span className="absolute right-3 top-3 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold text-white">
                            {
                              entries.length
                            }{" "}
                            imagen
                            {
                              entries.length ===
                                1
                                ? ""
                                : "es"
                            }
                          </span>
                        )}

                        {allSuccess && (
                          <span className="absolute bottom-3 left-3 rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white">
                            Subida
                          </span>
                        )}

                        {hasError && (
                          <span className="absolute bottom-3 left-3 rounded-full bg-red-600 px-3 py-1.5 text-[10px] font-semibold text-white">
                            Error
                          </span>
                        )}

                        {uploading && (
                          <span className="absolute bottom-3 left-3 rounded-full bg-black px-3 py-1.5 text-[10px] font-semibold text-white">
                            Subiendo...
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                              SKU{" "}
                              {
                                product.sku
                              }
                            </p>

                            <h3 className="mt-2 truncate text-base font-medium text-neutral-950">
                              {
                                cleanProductName(
                                  product
                                )
                              }
                            </h3>
                          </div>

                          {product.is_published ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                              Publicado
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                              Borrador
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          <input
                            id={`product-files-${product.id}`}
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
                            className="hidden"
                            onChange={(
                              event
                            ) => {
                              appendFilesToProduct(
                                product,
                                event
                                  .target
                                  .files
                              );

                              event.target.value =
                                "";
                            }}
                          />

                          <label
                            htmlFor={`product-files-${product.id}`}
                            className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-black/10 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-black"
                          >
                            Seleccionar imagen
                          </label>
                        </div>

                        {entries.length >
                          0 && (
                          <div className="mt-4 space-y-2">
                            {entries.map(
                              (
                                entry,
                                index
                              ) => (
                                <div
                                  key={
                                    entry.id
                                  }
                                  className="rounded-xl bg-neutral-50 px-3 py-2.5"
                                >
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={
                                        entry
                                          .previewUrl
                                      }
                                      alt=""
                                      className="h-10 w-10 rounded-lg object-cover"
                                    />

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-[11px] font-medium text-neutral-700">
                                        {
                                          entry
                                            .file
                                            .name
                                        }
                                      </p>

                                      <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-neutral-400">
                                        {index ===
                                        0
                                          ? "Principal"
                                          : `Galería ${index + 1}`}
                                        {" · "}
                                        {
                                          entry.status
                                        }
                                      </p>
                                    </div>

                                    {!isUploading &&
                                      entry.status !==
                                        "success" && (
                                      <button
                                        type="button"
                                        aria-label="Quitar imagen"
                                        onClick={() =>
                                          removeEntry(
                                            product.id,
                                            entry.id
                                          )
                                        }
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white hover:text-black"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>

                                  {entry.error && (
                                    <p className="mt-2 text-[10px] leading-4 text-red-600">
                                      {
                                        entry.error
                                      }
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            openImageManager(
                              product
                            )
                          }
                          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white text-xs font-medium text-neutral-700 transition hover:border-black hover:text-black"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="4"
                              y="5"
                              width="16"
                              height="14"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />

                            <circle
                              cx="9"
                              cy="10"
                              r="1.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />

                            <path
                              d="m6 17 4-4 3 3 2-2 3 3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          Ver / eliminar imágenes
                        </button>

                        <button
                          type="button"
                          disabled={
                            isUploading ||
                            entries.length ===
                              0 ||
                            entries.every(
                              (
                                entry
                              ) =>
                                entry.status ===
                                "success"
                            )
                          }
                          onClick={() =>
                            uploadProduct(
                              product
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl bg-black text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          Subir este producto
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      {imageManagerOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeImageManager();
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.28)]">

            <div className="flex items-start justify-between gap-5 border-b border-neutral-100 px-6 py-5 sm:px-8">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Imágenes guardadas
                </p>

                <h2 className="mt-2 truncate text-2xl font-medium tracking-[-0.035em] text-neutral-950">
                  {
                    cleanProductName(
                      managedProduct
                    )
                  }
                </h2>

                <p className="mt-1 text-xs text-neutral-400">
                  SKU{" "}
                  {
                    managedProduct
                      ?.sku
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeImageManager
                }
                disabled={
                  isDeletingSavedImage ||
                  Boolean(
                    primaryImageUpdatingId
                  )
                }
                aria-label="Cerrar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-xl text-neutral-500 transition hover:bg-neutral-50 hover:text-black disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6 sm:px-8">
              {managedImagesMessage && (
                <div
                  className={`mb-5 rounded-2xl border px-4 py-3 text-xs font-medium leading-5 ${
                    managedImagesMessageType ===
                    "warning"
                      ? "border-amber-100 bg-amber-50 text-amber-800"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {
                    managedImagesMessage
                  }
                </div>
              )}

              {managedImagesError && (
                <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-700">
                  {
                    managedImagesError
                  }
                </div>
              )}

              {managedImagesLoading ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-neutral-500">
                    Cargando imágenes...
                  </p>
                </div>
              ) : managedImages.length ===
                0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
                  <p className="text-sm font-medium text-neutral-700">
                    Este producto no tiene imágenes guardadas.
                  </p>

                  <p className="mt-2 text-xs text-neutral-400">
                    Cierra esta ventana y utiliza “Seleccionar imagen” para agregar la primera.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {managedImages.map(
                    (
                      image,
                      index
                    ) => {
                      const imageUrl =
                        getSavedImageUrl(
                          image
                        );

                      return (
                        <article
                          key={
                            image.id
                          }
                          className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-sm"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f2ee]">
                            {imageUrl ? (
                              <img
                                src={
                                  imageUrl
                                }
                                alt={
                                  image.alt_text ||
                                  cleanProductName(
                                    managedProduct
                                  )
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                                  Vista previa no disponible
                                </p>
                              </div>
                            )}

                            {image.is_primary && (
                              <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white">
                                Principal
                              </span>
                            )}

                            <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-neutral-600 shadow-sm">
                              {
                                image.image_type ||
                                `Imagen ${index + 1}`
                              }
                            </span>
                          </div>

                          <div className="p-4">
                            <p className="truncate text-xs font-medium text-neutral-800">
                              {
                                image.original_filename ||
                                image.alt_text ||
                                `Imagen ${index + 1}`
                              }
                            </p>

                            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-neutral-400">
                              {
                                image.storage_provider ===
                                "RAILWAY"
                                  ? "Railway Storage"
                                  : "URL externa"
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                setManagedImageAsPrimary(
                                  image
                                )
                              }
                              disabled={
                                image.is_primary ||
                                isDeletingSavedImage ||
                                Boolean(
                                  primaryImageUpdatingId
                                )
                              }
                              className={`mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-xs font-medium transition disabled:cursor-not-allowed ${
                                image.is_primary
                                  ? "border-black bg-black text-white"
                                  : "border-black/10 bg-white text-neutral-700 hover:border-black hover:text-black"
                              } disabled:opacity-100`}
                            >
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill={
                                  image.is_primary
                                    ? "currentColor"
                                    : "none"
                                }
                                aria-hidden="true"
                              >
                                <path
                                  d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.78l-5.4 2.83 1.03-6.01-4.36-4.25 6.03-.88L12 3Z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>

                              {image.is_primary
                                ? "Imagen principal"
                                : primaryImageUpdatingId ===
                                  image.id
                                  ? "Actualizando..."
                                  : "Hacer principal"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteImageTarget(
                                  image
                                )
                              }
                              disabled={
                                isDeletingSavedImage ||
                                Boolean(
                                  primaryImageUpdatingId
                                )
                              }
                              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>

                              Eliminar imagen
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-neutral-100 px-6 py-4 sm:px-8">
              <p className="text-xs text-neutral-400">
                {
                  managedImages.length
                }{" "}
                imagen
                {
                  managedImages.length ===
                  1
                    ? ""
                    : "es"
                }{" "}
                guardada
                {
                  managedImages.length ===
                  1
                    ? ""
                    : "s"
                }
              </p>

              <button
                type="button"
                onClick={
                  closeImageManager
                }
                disabled={
                  isDeletingSavedImage ||
                  Boolean(
                    primaryImageUpdatingId
                  )
                }
                className="h-10 rounded-full bg-black px-5 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteImageTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.3)]">

            <div className="p-6 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h3 className="mt-5 text-xl font-medium tracking-[-0.03em] text-neutral-950">
                ¿Eliminar esta imagen?
              </h3>

              <p className="mt-3 text-sm leading-6 text-neutral-500">
                La imagen se eliminará del producto y, si está almacenada en Railway, también se intentarán eliminar sus variantes thumbnail, card y detail.
              </p>

              {getSavedImageUrl(
                deleteImageTarget
              ) && (
                <div className="mt-5 overflow-hidden rounded-2xl bg-neutral-100">
                  <img
                    src={
                      getSavedImageUrl(
                        deleteImageTarget
                      )
                    }
                    alt=""
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-neutral-100 p-4">
              <button
                type="button"
                onClick={() =>
                  setDeleteImageTarget(
                    null
                  )
                }
                disabled={
                  isDeletingSavedImage
                }
                className="h-11 flex-1 rounded-xl border border-black/10 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  confirmDeleteSavedImage
                }
                disabled={
                  isDeletingSavedImage
                }
                className="h-11 flex-1 rounded-xl bg-red-600 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingSavedImage
                  ? "Eliminando..."
                  : "Eliminar imagen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

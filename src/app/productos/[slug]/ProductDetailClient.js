"use client";

import {

useEffect,

useMemo,

useRef,

useState,

} from "react";

import Link from "next/link";

import {

useCartStore,

} from "@/store/cartStore";

import {
apiRequest,
} from "@/services/api";

/* =========================================*

*   FORMATEAR PRECIO CLP*

*========================================= */

const formatPrice = (
value
) => {

const number = Number(value);

if (!Number.isFinite(number)) {

return "$0";

}

return new Intl.NumberFormat(

"es-CL",

{

style: "currency",

currency: "CLP",

maximumFractionDigits: 0,

}

).format(number);

};

/* =========================================*

*   FORMATEAR MEDIDA*

*========================================= */

const formatMeasure = (

value
,

suffix = "mm"

) => {

if (

value === null ||

value === undefined ||

value === ""

) {

return "No informado";

}

const number = Number(value);

if (

!Number.isFinite(number) ||

number <= 0

) {

return "No informado";

}

return `${number} ${suffix}`;

};

/* =========================================*

*   PRODUCT DETAIL CLIENT*

*========================================= */

export default function ProductDetailClient({

product
,

}) {

/* =========================================*

*     GALERÍA*

*  ========================================= */

const images = useMemo(() => {

if (

Array.isArray(product.images) &&

product.images.length > 0

) {

return product.images;

}

if (product.primary_image) {

return [

product.primary_image,

];

}

return [];

}, [

product.images,

product.primary_image,

]);

const initialImage =

product.primary_image ||

images[0] ||

null;

const [

selectedImageId,

setSelectedImageId,

] = useState(

initialImage?.id ||

null

);

/* =========================================*

*     STOCK*

*  ========================================= */

const [

showStock,

setShowStock,

] = useState(false);

/* =========================================*
*     PRECIO PERSONALIZADO DEL CLIENTE*
*  ========================================= */
const [
customerPricing,
setCustomerPricing,
] = useState(null);

const [
customerPricingLoading,
setCustomerPricingLoading,
] = useState(false);


/* =========================================*

*     FEEDBACK COMPARTIR*

*  ========================================= */

const [

shareFeedback,

setShareFeedback,

] = useState("");

/* =========================================*

*     ZOOM*

*  ========================================= */

const [

isZoomOpen,

setIsZoomOpen,

] = useState(false);

const [

zoomScale,

setZoomScale,

] = useState(1);

/* =========================================

*     ZOOM LATERAL / MAGNIFIER*

*  ========================================= */

const mainImageContainerRef =

useRef(null);

const mainImageRef =

useRef(null);

const [

isMagnifierVisible,

setIsMagnifierVisible,

] = useState(false);

const [

magnifierPosition,

setMagnifierPosition,

] = useState({

lensLeft: 0,

lensTop: 0,

lensSize: 150,

originX: 50,

originY: 50,

});

/* =========================================*

*     CARRITO*

*  ========================================= */

const items =

useCartStore(

(
state
) =>

state.items

);

const addItem =

useCartStore(

(
state
) =>

state.addItem

);

const [

quantityToAdd,

setQuantityToAdd,

] = useState(1);

/* =========================================*

*     IMAGEN SELECCIONADA*

*  ========================================= */

const selectedImage =

images.find(

(
image
) =>

image.id ===

selectedImageId

) ||

initialImage ||

null;

const mainImageUrl =

selectedImage?.detail_url ||

selectedImage?.card_url ||

product.primary_image_url ||

null;

const mainImageAlt =

selectedImage?.alt_text ||

product.primary_image_alt ||

product.name;

const selectedImageIndex =

images.findIndex(

(
image
) =>

selectedImage?.id

? image.id === selectedImage.id

: image === selectedImage

);

const canZoomSelectedImage =

selectedImageIndex === 1;

/* =========================================*

*     STOCK REAL*

*  ========================================= */

const availableStock =

Math.max(

Number(

product.available_web

) || 0,

0

);

const currentCartItem =

items.find(

(
item
) =>

item.product_id ===

product.id

);

const currentQuantity =

currentCartItem?.quantity ||

0;

/* =========================================
*     CANTIDAD TOTAL A EVALUAR PARA PRECIO
*     - Considera lo que ya existe en carrito
*     - La promoción por volumen se aplica por
*       umbral, no por múltiplos del mínimo
*  ========================================= */
const requestedTotalQuantity =

Math.max(

Number(currentQuantity) || 0,

0

) +

Math.max(

Number(quantityToAdd) || 1,

1

);

/* =========================================
*     PRECIO PERSONALIZADO SEGÚN CANTIDAD
*     - El backend vuelve a resolver el precio
*     - PRICE_LIST y promociones no se acumulan
*  ========================================= */
useEffect(() => {

if (

typeof window === "undefined" ||

!product?.id

) {

return;

}

/*
 * No inspeccionamos Web Storage para determinar la sesión.
 * apiRequest envía la cookie HttpOnly mediante
 * credentials: "include". Si no hay sesión, el backend
 * responderá 401 y simplemente no aplicaremos pricing
 * personalizado.
 */

const controller =
new AbortController();

let active = true;

setCustomerPricingLoading(true);

apiRequest(
`/products/pricing/${encodeURIComponent(
product.id
)}?quantity=${encodeURIComponent(
requestedTotalQuantity
)}`,
{
signal:
controller.signal,
}
)
.then((response) => {

if (!active) {

return;

}

if (
response?.success &&
response?.pricing
) {

setCustomerPricing(
response.pricing
);

return;

}

setCustomerPricing(null);
})
.catch((error) => {

if (
!active ||
error?.name ===
"AbortError"
) {

return;

}

if (
error?.status !== 401 &&
error?.status !== 403
) {

console.error(
"Error obteniendo precio personalizado:",
error
);
}

setCustomerPricing(null);
})
.finally(() => {

if (active) {

setCustomerPricingLoading(false);
}
});

return () => {

active = false;

controller.abort();
};
}, [
product?.id,
requestedTotalQuantity,
]);

const remainingStock =

Math.max(

availableStock -

currentQuantity,

0

);

const canAdd =

product.in_stock &&

availableStock > 0 &&

remainingStock > 0;

useEffect(() => {

if (remainingStock <= 0) {

setQuantityToAdd(1);

return;

}

setQuantityToAdd(

(
current
) =>

Math.min(

Math.max(current, 1),

remainingStock

)

);

}, [remainingStock]);

const stockText =

availableStock === 1

? "Solo 1 unidad en stock"

: `${availableStock} unidades disponibles`;

/* =========================================
*     PRECIO · MÚLTIPLES PROMOCIONES
*
*     - Un producto puede tener varias FIXED_PRICE
*     - Un producto puede tener varias QUANTITY_TIER
*     - Todas las promociones públicas compiten entre sí
*     - Gana el menor precio unitario aplicable
*     - Las promociones NO se acumulan
*     - La lista de precios del cliente compite después
*       contra la mejor promoción pública
*     - El umbral por cantidad se evalúa sobre el total
*       que quedará en el carrito
*  ========================================= */

const catalogBasePrice =
Number(
product
.base_price ??
0
);

const safeCatalogBasePrice =
Number.isFinite(
catalogBasePrice
) &&
catalogBasePrice >= 0
? catalogBasePrice
: 0;

const activePromotions = useMemo(() => {

let rawPromotions =
product?.active_promotions;

if (
typeof rawPromotions === "string"
) {

try {

rawPromotions =
JSON.parse(rawPromotions);

} catch {

rawPromotions = [];

}
}

const normalizeTiers = (
rawTiers
) => {

let tiers =
rawTiers;

if (
typeof tiers === "string"
) {

try {

tiers =
JSON.parse(tiers);

} catch {

tiers = [];

}
}

if (!Array.isArray(tiers)) {

return [];

}

return tiers
.map((tier) => ({
id:
tier?.id || null,

min_quantity:
Number(
tier?.min_quantity
),

unit_price:
Number(
tier?.unit_price
),
}))
.filter((tier) =>
Number.isFinite(
tier.min_quantity
) &&
Number.isFinite(
tier.unit_price
) &&
tier.min_quantity > 0 &&
tier.unit_price >= 0
)
.sort((left, right) =>
left.min_quantity -
right.min_quantity
);

};

const normalizedPromotions =
Array.isArray(
rawPromotions
)
? rawPromotions
.map((promotion) => {

const promotionType =
String(
promotion?.promotion_type ||
promotion?.type ||
""
)
.trim()
.toUpperCase();

const promotionalPrice =
promotion?.promotional_price === null ||
promotion?.promotional_price === undefined ||
promotion?.promotional_price === ""
? null
: Number(
promotion.promotional_price
);

return {
id:
promotion?.id || null,

name:
promotion?.name || null,

promotion_type:
promotionType,

promotional_price:
Number.isFinite(
promotionalPrice
)
? promotionalPrice
: null,

starts_at:
promotion?.starts_at || null,

ends_at:
promotion?.ends_at || null,

tiers:
normalizeTiers(
promotion?.tiers ||
promotion?.quantity_tiers ||
[]
),
};

})
.filter((promotion) =>
Boolean(
promotion.id
) &&
(
promotion.promotion_type ===
"FIXED_PRICE" ||
promotion.promotion_type ===
"QUANTITY_TIER"
)
)
: [];

/*
 * Compatibilidad con respuestas antiguas:
 * si todavía no viene active_promotions,
 * construimos una promoción a partir de
 * los campos legacy del producto.
 */
if (
normalizedPromotions.length === 0
) {

const legacyType =
String(
product?.promotion_type ||
""
)
.trim()
.toUpperCase();

if (
legacyType ===
"FIXED_PRICE"
) {

const legacyPrice =
Number(
product?.promotional_price ??
product?.final_price
);

if (
Number.isFinite(
legacyPrice
) &&
legacyPrice >= 0
) {

normalizedPromotions.push({
id:
product?.promotion_id ||
"legacy-fixed",

name:
product?.promotion_name ||
null,

promotion_type:
"FIXED_PRICE",

promotional_price:
legacyPrice,

starts_at:
product?.promotion_starts_at ||
null,

ends_at:
product?.promotion_ends_at ||
null,

tiers:
[],
});

}
}

if (
legacyType ===
"QUANTITY_TIER"
) {

const legacyTiers =
normalizeTiers(
product?.quantity_tiers
);

if (
legacyTiers.length > 0
) {

normalizedPromotions.push({
id:
product?.promotion_id ||
"legacy-quantity",

name:
product?.promotion_name ||
null,

promotion_type:
"QUANTITY_TIER",

promotional_price:
null,

starts_at:
product?.promotion_starts_at ||
null,

ends_at:
product?.promotion_ends_at ||
null,

tiers:
legacyTiers,
});

}
}

}

return normalizedPromotions;

}, [
product?.active_promotions,
product?.promotion_id,
product?.promotion_name,
product?.promotion_type,
product?.promotional_price,
product?.final_price,
product?.promotion_starts_at,
product?.promotion_ends_at,
product?.quantity_tiers,
]);

const publicPromotionResolution =
useMemo(() => {

let bestCandidate = {
unit_price:
safeCatalogBasePrice,

promotion:
null,

tier:
null,
};

for (
const promotion of
activePromotions
) {

if (
promotion.promotion_type ===
"FIXED_PRICE"
) {

const promotionalPrice =
Number(
promotion.promotional_price
);

if (
Number.isFinite(
promotionalPrice
) &&
promotionalPrice >= 0 &&
promotionalPrice <
bestCandidate.unit_price
) {

bestCandidate = {
unit_price:
promotionalPrice,

promotion,

tier:
null,
};

}

continue;
}

if (
promotion.promotion_type !==
"QUANTITY_TIER"
) {

continue;
}

let matchedTier =
null;

for (
const tier of
promotion.tiers
) {

if (
requestedTotalQuantity >=
tier.min_quantity
) {

matchedTier =
tier;

} else {

break;
}
}

if (!matchedTier) {

continue;
}

const tierPrice =
Number(
matchedTier.unit_price
);

if (
Number.isFinite(
tierPrice
) &&
tierPrice >= 0 &&
tierPrice <
bestCandidate.unit_price
) {

bestCandidate = {
unit_price:
tierPrice,

promotion,

tier:
matchedTier,
};

}
}

return bestCandidate;

}, [
activePromotions,
requestedTotalQuantity,
safeCatalogBasePrice,
]);

const bestPublicPromotion =
publicPromotionResolution
.promotion;

const matchedQuantityTier =
publicPromotionResolution
.tier;

const publicPreviewPrice =
Number(
publicPromotionResolution
.unit_price
);

const localPricingSource =
bestPublicPromotion &&
publicPreviewPrice <
safeCatalogBasePrice
? (
bestPublicPromotion
.promotion_type ===
"QUANTITY_TIER"
? "QUANTITY_PROMOTION"
: "PROMOTION"
)
: "BASE";

const hasCurrentCustomerPricing =
Number(
customerPricing?.quantity
) ===
Number(
requestedTotalQuantity
);

const currentBackendPrice =
hasCurrentCustomerPricing
? Number(
customerPricing?.final_price
)
: NaN;

const hasCurrentBackendPrice =
Number.isFinite(
currentBackendPrice
) &&
currentBackendPrice >= 0;

const rawCustomerPriceListPrice =
customerPricing?.price_list_price;

const customerPriceListPrice =
rawCustomerPriceListPrice === null ||
rawCustomerPriceListPrice === undefined ||
rawCustomerPriceListPrice === ""
? NaN
: Number(
rawCustomerPriceListPrice
);

const hasCustomerPriceListPrice =
Boolean(
customerPricing?.price_list
) &&
Boolean(
customerPricing?.rule
) &&
Number.isFinite(
customerPriceListPrice
) &&
customerPriceListPrice > 0;

const priceListWins =
hasCustomerPriceListPrice &&
customerPriceListPrice <=
publicPreviewPrice &&
(
!hasCurrentBackendPrice ||
customerPriceListPrice <=
currentBackendPrice
);

const backendPriceWins =
!priceListWins &&
hasCurrentBackendPrice &&
currentBackendPrice <
publicPreviewPrice;

const finalPrice =
Number(
priceListWins
? customerPriceListPrice
: backendPriceWins
? currentBackendPrice
: publicPreviewPrice
);

const basePrice =
Number(
customerPricing
?.base_price ??
safeCatalogBasePrice ??
finalPrice
);

const pricingSource =
priceListWins
? "PRICE_LIST"
: backendPriceWins
? (
customerPricing
?.pricing_source ||
localPricingSource
)
: localPricingSource;

const hasPriceListDiscount =

pricingSource ===
"PRICE_LIST" &&

finalPrice <
basePrice;

const hasQuantityPromotion =

pricingSource ===
"QUANTITY_PROMOTION" &&

finalPrice <
basePrice;

const hasPromotion =

(
pricingSource ===
"PROMOTION" ||
pricingSource ===
"QUANTITY_PROMOTION"
) &&

finalPrice <
basePrice;

const hasCommercialDiscount =

finalPrice <
basePrice;

const appliedPromotionId =
hasPromotion
? (
hasCurrentCustomerPricing &&
customerPricing
?.promotion
?.id
? customerPricing
.promotion
.id
: bestPublicPromotion
?.id ||
null
)
: null;

const appliedPromotionName =
hasPromotion
? (
hasCurrentCustomerPricing &&
customerPricing
?.promotion
?.name
? customerPricing
.promotion
.name
: bestPublicPromotion
?.name ||
null
)
: null;

const appliedPromotionType =
hasPromotion
? (
hasCurrentCustomerPricing &&
customerPricing
?.promotion
?.type
? String(
customerPricing
.promotion
.type
)
.trim()
.toUpperCase()
: bestPublicPromotion
?.promotion_type ||
null
)
: null;

const appliedPromotion =
appliedPromotionId
? (
activePromotions.find(
(promotion) =>
promotion.id ===
appliedPromotionId
) ||
bestPublicPromotion ||
null
)
: null;

const appliedQuantityTier =

hasQuantityPromotion
? (
hasCurrentCustomerPricing &&
customerPricing
?.promotion
?.tier
? customerPricing
.promotion
.tier
: matchedQuantityTier
)
: null;

const quantityPromotionMin =
Number(
appliedQuantityTier
?.min_quantity
);

const appliedQuantityTiers =
appliedPromotionType ===
"QUANTITY_TIER"
? (
appliedPromotion
?.tiers ||
[]
)
: [];

const customerPriceListName =

customerPricing
?.price_list
?.name ||

null;

const customerDiscountValue =

Number(
customerPricing
?.rule
?.discount_value ??
0
);

const customerDiscountType =

customerPricing
?.rule
?.discount_type ||

null;

const customerDiscountAmount =

Math.max(
basePrice - finalPrice,
0
);

const customerDiscountPercentage =

Number(
basePrice > 0
? (
(
basePrice - finalPrice
) /
basePrice
) * 100
: 0
);

const customerDiscountPercentageLabel =

Number.isFinite(
customerDiscountPercentage
) &&
customerDiscountPercentage > 0

? `${Number(
customerDiscountPercentage.toFixed(2)
)}% dto.`

: null;

/*
 * REGLA VISUAL DE OFERTAS
 *
 * - Si existen promociones por cantidad, en la ficha pública
 *   mostramos solamente esas promociones.
 * - Las promociones de precio fijo siguen participando en el
 *   motor de precios, pero quedan ocultas visualmente mientras
 *   exista al menos una QUANTITY_TIER.
 * - Si no existen promociones por cantidad, mostramos las
 *   promociones de precio fijo.
 *
 * Esto modifica únicamente la presentación. No cambia el cálculo
 * del precio final ni la comparación con listas de precios.
 */
const quantityPromotions =
activePromotions.filter(
(promotion) =>
promotion.promotion_type ===
"QUANTITY_TIER"
);

const fixedPromotions =
activePromotions.filter(
(promotion) =>
promotion.promotion_type ===
"FIXED_PRICE"
);

const visiblePromotions =
quantityPromotions.length > 0
? quantityPromotions
: fixedPromotions;

const hasVisiblePromotions =
visiblePromotions.length > 0;

/* =========================================
   NOMBRE VISUAL DEL PRODUCTO
   - El título no muestra "| acabado ..."
   - El acabado se renderiza debajo
========================================= */

const displayProductName =

product.name

? product.name.split("|")[0].trim()

: "";

/* =========================================*

*     PROCEDENCIA SEGÚN MARCA*

*  ========================================= */

const isKarikal =

String(
product?.brand_slug ||
""
)
.trim()
.toLowerCase() ===
"karikal" ||
String(
product?.brand ||
""
)
.trim()
.toLowerCase() ===
"karikal";

const isKisafixAdhesive =

(
String(
product?.brand_slug ||
product?.brand ||
""
)
.trim()
.toLowerCase() ===
"kisafix"
) &&
(
String(
product?.category ||
""
)
.trim()
.toLowerCase() ===
"adhesivos"
);

/* =========================================*

*     CATEGORÍA ADHESIVOS*
*     - Sólo controla la ficha técnica*
*  ========================================= */

const isAdhesiveProduct =

String(
product?.category ||
""
)
.trim()
.toLowerCase() ===
"adhesivos";

/* =========================================*

*     DESCRIPCIÓN*

*  ========================================= */

const summaryDescription =

product
.short_description ||

product
.description ||

null;

const fullDescription =

product
.description &&

product
.description !==

summaryDescription

? 
product
.description

: null;

const toneNotice =

"RECUERDA QUE LOS TONOS PUEDEN VARIAR EN FUNCIÓN DE CADA PANTALLA O DISPOSITIVO.";

const fullDescriptionWithoutToneNotice =

fullDescription

? fullDescription
.replace(toneNotice, "")
.replace(/\n{3,}/g, "\n\n")
.trim()

: null;

/* =========================================

*   FORMATEAR DESCRIPCIÓN DEL PRODUCTO*

========================================= */

const formatProductDescription = (
text
) => {

if (!
text
) {

return null;

}

const highlightedParts =

/(\(formalita\)|\(High Pressure Laminate\)|IMSL|ANTIBACTERIAL|RECUERDA QUE LOS TONOS PUEDEN VARIAR EN FUNCIÓN DE CADA PANTALLA O DISPOSITIVO\.)/g;

return text

.split(highlightedParts)

.map((
part
, 
index
) => {

if (!
part
) {

return null;

}

if (

part
 === "(formalita)" ||

part
 === "(High Pressure Laminate)" ||

part
 === "IMSL"

) {

return (

<strong

key={`${
part
}-${
index
}`}

style={{

fontWeight: 700,

color: "#171717",

}}

>

{
part
}

</strong>

);

}

if (
part
 === "ANTIBACTERIAL") {

return (

<strong

key={`${
part
}-${
index
}`}

style={{

fontWeight: 700,

color: "#dc2626",

}}

>

{
part
}

</strong>

);

}

if (

part
 ===

"RECUERDA QUE LOS TONOS PUEDEN VARIAR EN FUNCIÓN DE CADA PANTALLA O DISPOSITIVO."

) {

return (

<strong

key={`${
part
}-${
index
}`}

style={{

fontWeight: 700,

color: "#dc2626",

}}

>

{
part
}

</strong>

);

}

return (

<span key={`text-${
index
}`}>

{
part
}

</span>

);

});

};

/* =========================================*

*     CANTIDAD + AGREGAR AL CARRITO*

*  ========================================= */

const handleDecreaseQuantity =

() => {

setQuantityToAdd(

(
current
) =>

Math.max(

current
 - 1,

1

)

);

};

const handleIncreaseQuantity =

() => {

if (!canAdd) {

return;

}

setQuantityToAdd(

(
current
) =>

Math.min(

current
 + 1,

remainingStock

)

);

};

const handleAddToCart =

() => {

if (!canAdd) {

return;

}

const quantity =

Math.min(

Math.max(

quantityToAdd,

1

),

remainingStock

);

const productToAdd = {

product_id:

product.id,

slug:

product.slug,

sku:

product.sku,

name:

product.name,

price:

finalPrice,

base_price:

basePrice,

pricing_source:

pricingSource,

promotion_id:

appliedPromotionId,

promotion_name:

appliedPromotionName,

promotion_type:

hasPromotion
? appliedPromotionType
: null,

quantity_tiers:

appliedQuantityTiers,

active_promotions:

activePromotions,

quantity_promotion_min:

Number.isFinite(
quantityPromotionMin
)
? quantityPromotionMin
: null,

customer_price:

hasPriceListDiscount,

customer_price_list_price:

hasCustomerPriceListPrice
? customerPriceListPrice
: null,

discount_amount:

hasPriceListDiscount
? customerDiscountAmount
: Math.max(
basePrice - finalPrice,
0
),

discount_percentage:

hasPriceListDiscount
? customerDiscountPercentage
: (
basePrice > 0 &&
finalPrice < basePrice
? (
(
basePrice - finalPrice
) /
basePrice
) * 100
: 0
),

price_list_id:

hasCustomerPriceListPrice
? customerPricing
?.price_list
?.id ||
null
: null,

price_rule_id:

hasCustomerPriceListPrice
? customerPricing
?.rule
?.id ||
null
: null,

price_rule_scope:

hasCustomerPriceListPrice
? customerPricing
?.rule
?.scope_type ||
null
: null,

image_url:

product

.primary_image

?.card_url ||

product

.primary_image_url ||

null,

image_alt:

product

.primary_image

?.alt_text ||

product

.primary_image_alt ||

product.name,

available_web:

availableStock,

in_stock:

product.in_stock,

};

for (

let index = 0;

index < quantity;

index += 1

) {

addItem(productToAdd);

}

setQuantityToAdd(1);

};

/* =========================================*

*     URL ACTUAL*

*  ========================================= */

const getCurrentUrl =

() => {

if (

typeof window ===

"undefined"

) {

return "";

}

return window.location.href;

};

/* =========================================*

*     COMPARTIR WHATSAPP*

*  ========================================= */

const handleShareWhatsApp =

() => {

const url =

getCurrentUrl();

const message =

`${product.name}\n` +

`${formatPrice(

finalPrice

)} IVA incluido\n\n` +

url;

const whatsappUrl =

`https://wa.me/?text=${encodeURIComponent(

message

)}`;

window.open(

whatsappUrl,

"_blank",

"noopener,noreferrer"

);

};

/* =========================================*

*     COMPARTIR FACEBOOK*

*  ========================================= */

const handleShareFacebook =

() => {

const url =

getCurrentUrl();

const facebookUrl =

`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(

url

)}`;

window.open(

facebookUrl,

"_blank",

"noopener,noreferrer"

);

};

/* =========================================*

*     COMPARTIR INSTAGRAM*

*  ========================================= */

const handleShareInstagram =

async () => {

const url =

getCurrentUrl();

try {

if (

typeof navigator !==

"undefined" &&

navigator.share

) {

await navigator.share({

title:

product.name,

text:

`${product.name} - ${formatPrice(

finalPrice

)} IVA incluido`,

url,

});

return;

}

if (

typeof navigator !==

"undefined" &&

navigator.clipboard

) {

await navigator.clipboard.writeText(

url

);

setShareFeedback(

"Enlace copiado para compartir en Instagram."

);

setTimeout(() => {

setShareFeedback("");

}, 3000);

}

} catch (error) {

if (

error?.name !==

"AbortError"

) {

console.error(

"Error compartiendo producto:",

error

);

}

}

};

/* =========================================

*     ZOOM LATERAL / MAGNIFIER*

*     Desktop:*

*     - Sigue el mouse sobre la imagen real.*

*     - Muestra una lente sobre la zona observada.*

*     - Renderiza una ampliación lateral usando*

*       la variante detail_url.*

*     Tablet / móvil:*

*     - El hover no se utiliza.*

*     - El tap mantiene el visor existente.*

*  ========================================= */

const handleMagnifierMove =

(
event
) => {

if (!canZoomSelectedImage) {

setIsMagnifierVisible(false);

return;

}

const container =

mainImageContainerRef.current;

const image =

mainImageRef.current;

if (

!container ||

!image ||

!image.naturalWidth ||

!image.naturalHeight

) {

setIsMagnifierVisible(false);

return;

}

const rect =

container.getBoundingClientRect();

if (

rect.width <= 0 ||

rect.height <= 0

) {

setIsMagnifierVisible(false);

return;

}

const imageRatio =

image.naturalWidth /

image.naturalHeight;

const containerRatio =

rect.width /

rect.height;

let renderedWidth;

let renderedHeight;

let offsetX = 0;

let offsetY = 0;

if (

imageRatio >

containerRatio

) {

renderedWidth =

rect.width;

renderedHeight =

rect.width /

imageRatio;

offsetY =

(

rect.height -

renderedHeight

) / 2;

} else {

renderedHeight =

rect.height;

renderedWidth =

rect.height *

imageRatio;

offsetX =

(

rect.width -

renderedWidth

) / 2;

}

const pointerX =

event.clientX -

rect.left;

const pointerY =

event.clientY -

rect.top;

const isInsideImage =

pointerX >= offsetX &&

pointerX <=

offsetX +

renderedWidth &&

pointerY >= offsetY &&

pointerY <=

offsetY +

renderedHeight;

if (!isInsideImage) {

setIsMagnifierVisible(false);

return;

}

const requestedLensSize =

150;

const lensSize =

Math.max(

80,

Math.min(

requestedLensSize,

renderedWidth,

renderedHeight

)

);

const minLeft =

offsetX;

const maxLeft =

offsetX +

renderedWidth -

lensSize;

const minTop =

offsetY;

const maxTop =

offsetY +

renderedHeight -

lensSize;

const lensLeft =

Math.min(

Math.max(

pointerX -

lensSize / 2,

minLeft

),

maxLeft

);

const lensTop =

Math.min(

Math.max(

pointerY -

lensSize / 2,

minTop

),

maxTop

);

const originX =

(

pointerX /

rect.width

) * 100;

const originY =

(

pointerY /

rect.height

) * 100;

setMagnifierPosition({

lensLeft,

lensTop,

lensSize,

originX,

originY,

});

setIsMagnifierVisible(true);

};

const handleMagnifierLeave =

() => {

setIsMagnifierVisible(false);

};

/* =========================================*

*     ABRIR ZOOM*

*  ========================================= */

const handleOpenZoom =

() => {

if (

!mainImageUrl ||

!canZoomSelectedImage

) {

return;

}

setZoomScale(1);

setIsZoomOpen(true);

};

/* =========================================*

*     CERRAR ZOOM*

*  ========================================= */

const handleCloseZoom =

() => {

setIsZoomOpen(false);

setZoomScale(1);

};

/* =========================================*

*     AUMENTAR ZOOM*

*  ========================================= */

const handleZoomIn =

() => {

setZoomScale(

(
current
) =>

Math.min(

current + 0.5,

4

)

);

};

/* =========================================*

*     REDUCIR ZOOM*

*  ========================================= */

const handleZoomOut =

() => {

setZoomScale(

(
current
) =>

Math.max(

current - 0.5,

1

)

);

};

/* =========================================*

*     RESTABLECER ZOOM*

*  ========================================= */

const handleResetZoom =

() => {

setZoomScale(1);

};

/* =========================================*

*     DOBLE CLIC EN VISOR*

*  ========================================= */

const handleDoubleClickZoom =

() => {

setZoomScale(

(
current
) =>

current > 1

? 1

: 2

);

};

/* =========================================*

*     BLOQUEAR SCROLL + ESC*

*     CUANDO EL VISOR ESTÁ ABIERTO*

*  ========================================= */

useEffect(() => {

if (!isZoomOpen) {

return undefined;

}

const previousOverflow =

document.body.style.overflow;

document.body.style.overflow =

"hidden";

const handleKeyDown =

(
event
) => {

if (

event.key ===

"Escape"

) {

handleCloseZoom();

}

if (

event.key === "+"

||

event.key === "="

) {

handleZoomIn();

}

if (

event.key === "-"

) {

handleZoomOut();

}

if (

event.key === "0"

) {

handleResetZoom();

}

};

window.addEventListener(

"keydown",

handleKeyDown

);

return () => {

document.body.style.overflow =

previousOverflow;

window.removeEventListener(

"keydown",

handleKeyDown

);

};

}, [isZoomOpen]);

/* =========================================*

*     FICHA TÉCNICA*

*  ========================================= */

const technicalMeasurements = [

{

label: "Largo",

value:

formatMeasure(

product.height_mm

),

},

{

label: "Ancho",

value:

formatMeasure(

product.width_mm

),

},

{

label: "Espesor",

value:

formatMeasure(

product.thickness_mm

),

},

];

return (

<>

<main className="bg-white">

<div className="mx-auto max-w-[1450px] px-5 pb-20 pt-8 sm:px-8 lg:px-12 lg:pb-28 lg:pt-12">

{
/* =====================================*

*              BREADCRUMB*

*          ===================================== */
}

<nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-neutral-400">

<Link

href="/"

className="transition-colors hover:text-neutral-950"

>

Inicio

</Link>

<span>/</span>

<Link

href="/productos"

className="transition-colors hover:text-neutral-950"

>

Productos

</Link>

{product.category && (

<>

<span>/</span>

<span>

{

product.category

}

</span>

</>

)}

</nav>

{
/* =====================================*

*              PRODUCTO*

*          ===================================== */
}

<div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.72fr)] xl:gap-20">

{
/* ===================================*

*                GALERÍA*

*            =================================== */
}

<section className="order-1 relative w-full xl:order-none xl:max-w-[720px]">

{
/* =================================

*                  IMAGEN PRINCIPAL + ZOOM*

*              ================================= */}

<div className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white">

<div

ref={mainImageContainerRef}

className="flex h-[420px] items-center justify-center sm:h-[520px] lg:h-[600px] xl:h-[620px]"

>

{mainImageUrl ? (

<button

type="button"

onClick={handleOpenZoom}

onMouseEnter={handleMagnifierMove}

onMouseMove={handleMagnifierMove}

onMouseLeave={handleMagnifierLeave}

disabled={!canZoomSelectedImage}

className={`group relative flex h-full w-full items-center justify-center overflow-hidden p-4 sm:p-5 lg:p-6 ${

canZoomSelectedImage

? "cursor-zoom-in"

: "cursor-default"

}`}

aria-label={

canZoomSelectedImage

? `Ampliar ${mainImageAlt}`

: mainImageAlt

}

>

<img

ref={mainImageRef}

key={

selectedImage?.id ||

mainImageUrl

}

src={

mainImageUrl

}

alt={

mainImageAlt

}

className="h-full w-full select-none rounded-[1.75rem] object-contain"

draggable="false"

/>

{
/* ===========================

*                          LENTE DEL ZOOM*

*                          Solo escritorio XL+*

*                      =========================== */}

{canZoomSelectedImage &&

isMagnifierVisible && (

<span

className="pointer-events-none absolute hidden rounded-xl border-2 border-white/90 bg-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-[1px] xl:block"

style={{

left:

magnifierPosition.lensLeft,

top:

magnifierPosition.lensTop,

width:

magnifierPosition.lensSize,

height:

magnifierPosition.lensSize,

}}

/>

)}

{
/* ===========================

*                          INDICADOR ZOOM*

*                      =========================== */}

{canZoomSelectedImage && (

<span className="pointer-events-none absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition duration-300 group-hover:bg-black group-hover:text-white">

<svg

viewBox="0 0 24 24"

fill="none"

stroke="currentColor"

strokeWidth="1.8"

aria-hidden="true"

className="h-5 w-5"

>

<circle

cx="11"

cy="11"

r="6"

/>

<path d="m16 16 4 4" />

<path d="M11 8v6" />

<path d="M8 11h6" />

</svg>

</span>

)}

</button>

) : (

<div className="flex h-full w-full items-center justify-center">

<div className="text-center">

<p className="text-sm font-semibold tracking-[0.2em] text-neutral-400">

LAMINATI

</p>

<p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-neutral-300">

Imagen próximamente

</p>

</div>

</div>

)}

</div>

{
/* ===============================

*                    DISPONIBILIDAD*

*                =============================== */}

<div className="pointer-events-none absolute right-5 top-5">

{!product.in_stock || availableStock <= 0 ? (

<span className="rounded-full bg-red-600 px-4 py-2 text-xs font-medium text-white shadow-sm backdrop-blur">

Sin stock

</span>

) : availableStock === 1 ? (

<span className="rounded-full bg-amber-500 px-4 py-2 text-xs font-medium text-white shadow-sm backdrop-blur">

Solo 1 unidad

</span>

) : (

<span className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm backdrop-blur">

Disponible

</span>

)}

</div>

{
/* ===============================

*                    PROMOCIÓN*

*                =============================== */}

{(hasPriceListDiscount || hasPromotion) && (

<div className="pointer-events-none absolute left-5 top-5 z-20">

<span className="inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:min-h-14 sm:px-8 sm:text-sm">

{
hasPriceListDiscount
? `Precio exclusivo cliente${
customerDiscountPercentageLabel
? ` · ${customerDiscountPercentageLabel.replace(
" dto.",
""
)}`
: ""
}`
: "Oferta"
}

</span>

</div>

)}

</div>

{
/* =================================

*                  PANEL DE ZOOM LATERAL*

*                  Solo escritorio XL+*

*              ================================= */}

{mainImageUrl &&

canZoomSelectedImage && (

<div

className={`pointer-events-none absolute left-[calc(100%+1.25rem)] top-0 z-[80] hidden aspect-[720/620] w-[min(560px,42vw)] overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-[#f3f2ee] shadow-2xl transition-all duration-150 xl:block ${

isMagnifierVisible

? "visible opacity-100"

: "invisible opacity-0"

}`}

aria-hidden="true"

>

<img

src={mainImageUrl}

alt=""

draggable="false"

className="h-full w-full select-none object-contain"

style={{

transform: "scale(3.2)",

transformOrigin:

`${magnifierPosition.originX}% ${magnifierPosition.originY}%`,

transition:

"transform-origin 40ms linear",

}}

/>

<div className="absolute left-4 top-4 rounded-full border border-black/10 bg-white/90 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-700 shadow-sm backdrop-blur">

Zoom detalle

</div>

</div>

)}

{
/* =================================*

*                  MINIATURAS*

*              ================================= */
}

{images.length > 1 && (

<div className="mt-4 flex gap-3">

{images.map(

(
image
) => {

const thumbnail =

image.thumbnail_url ||

image.card_url ||

image.detail_url;

const isSelected =

selectedImage?.id ===

image.id;

if (!thumbnail) {

return null;

}

return (

<button

key={

image.id

}

type="button"

onClick={() =>

setSelectedImageId(

image.id

)

}

className={`relative h-24 w-20 overflow-hidden rounded-xl border bg-[#f3f2ee] transition sm:h-28 sm:w-24 ${

isSelected

? "border-black"

: "border-neutral-200 hover:border-neutral-400"

}`}

aria-label={`Ver ${

image.alt_text ||

product.name

}`}

>

<img

src={

thumbnail

}

alt={

image.alt_text ||

product.name

}

loading="lazy"

className="h-full w-full object-cover"

/>

</button>

);

}

)}

</div>

)}

{
/* =====================================*

*              DESCRIPCIÓN COMPLETA*

*          ===================================== */
}

{fullDescriptionWithoutToneNotice && (

<section className="mt-8 hidden border-t border-neutral-200 pt-8 xl:block">

<p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">

Información del producto

</p>

<h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">

Descripción

</h2>

<p className="mt-6 whitespace-pre-line text-[15px] leading-8 text-neutral-600">

{formatProductDescription(fullDescriptionWithoutToneNotice)}

</p>

</section>

)}

</section>

{
/* ===================================*

*                INFORMACIÓN PRODUCTO*

*            =================================== */
}

<section className="order-2 rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 xl:order-none xl:sticky xl:top-28 xl:self-start xl:p-10">

{
/* ===============================*

*                  CATEGORÍA*

*              =============================== */
}

{product.category && (

<p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">

{

product.category

}

</p>

)}

{
/* ===============================*

*                  NOMBRE*

*              =============================== */
}

<h1 className="mt-3 max-w-xl text-3xl font-medium leading-tight tracking-[-0.04em] text-neutral-950 sm:text-4xl lg:text-[2.75rem]">

{

displayProductName

}

</h1>

{product.finish && (

<p className="mt-2 text-xl font-medium leading-tight tracking-[-0.03em] text-neutral-700 sm:text-2xl lg:text-[1.75rem]">

acabado {product.finish}

</p>

)}

{
/* ===============================*

*                  SKU*

*              =============================== */
}

{product.sku && (

<p className="mt-4 text-sm text-neutral-400">

SKU {

product.sku

}

</p>

)}

{
/* ===============================*

*                  DESCRIPCIÓN*

*              =============================== */
}

{summaryDescription && (

<div className="mt-6">

<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">

Descripción

</p>

<p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-600">

{

summaryDescription

}

</p>

</div>

)}

{
/* ===============================*

*                  PRECIO + IVA*

*              =============================== */
}

<div className="mt-8">

{hasCommercialDiscount && (

<p className="mb-1 text-sm text-neutral-400 line-through">

{

formatPrice(

basePrice

)

}

</p>

)}

<div className="flex items-center gap-2">

<p className="text-3xl font-medium tracking-[-0.03em] text-neutral-950">

{

formatPrice(

finalPrice

)

}

</p>

<span className="text-xs font-medium text-neutral-500">

IVA incluido

</span>

</div>

{customerPricingLoading && (

<p className="mt-2 text-xs text-neutral-400">

Verificando precio personalizado...

</p>

)}

{hasPriceListDiscount && (

<div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">

<span>

Precio exclusivo cliente

</span>

{customerDiscountPercentageLabel && (

<span>

{
customerDiscountPercentageLabel
}

</span>

)}

{!customerDiscountPercentageLabel &&
customerDiscountAmount > 0 && (

<span>

{
`Ahorro ${formatPrice(
customerDiscountAmount
)}`
}

</span>

)}

</div>

)}

{hasQuantityPromotion &&
Number.isFinite(
quantityPromotionMin
) && (

<div className="mt-4 flex w-full items-center gap-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-emerald-800 shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:px-6 sm:py-5">

<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 text-emerald-600 shadow-sm sm:h-14 sm:w-14">

<svg
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
strokeWidth="1.8"
strokeLinecap="round"
strokeLinejoin="round"
className="h-6 w-6 sm:h-7 sm:w-7"
aria-hidden="true"
>
<path d="M20 13 13 20a2 2 0 0 1-2.83 0L4 13.83V4h9.83L20 10.17A2 2 0 0 1 20 13Z" />
<circle cx="9" cy="9" r="1.25" />
<path d="m12 15 3-3" />
<circle cx="12" cy="12" r="0.75" />
<circle cx="15" cy="15" r="0.75" />
</svg>

</div>

<div className="h-10 w-px shrink-0 bg-emerald-200 sm:h-12" />

<div className="min-w-0">

<p className="text-base font-semibold leading-tight tracking-[-0.02em] text-emerald-800 sm:text-lg">
Precio de oferta
</p>

<p className="mt-0.5 text-sm font-medium leading-tight text-emerald-700 sm:text-base">
{`desde ${quantityPromotionMin} ${
quantityPromotionMin === 1
? "lámina"
: "láminas"
}`}
</p>

</div>

</div>

)}


{hasVisiblePromotions && (

<div className="mt-4 rounded-[1.25rem] border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5">

<div className="flex flex-wrap items-start justify-between gap-3">

<div>

<p className="text-sm font-semibold tracking-[-0.01em] text-neutral-900">

Ofertas disponibles

</p>

<p className="mt-1 text-xs leading-5 text-neutral-500">

{quantityPromotions.length > 0
? "El precio mejora automáticamente al alcanzar la cantidad indicada."
: "Precio promocional vigente para este producto."}

</p>

</div>

<span className="inline-flex min-h-7 items-center rounded-full bg-white px-3 text-[11px] font-semibold text-neutral-600 shadow-sm ring-1 ring-black/[0.06]">

{
visiblePromotions.length === 1
? "1 oferta"
: `${visiblePromotions.length} ofertas`
}

</span>

</div>

<div className="mt-4 grid gap-2">

{visiblePromotions.map((promotion) => {

const isQuantityPromotion =
promotion.promotion_type ===
"QUANTITY_TIER";

let currentTier =
null;

if (isQuantityPromotion) {

for (const tier of promotion.tiers) {

if (
requestedTotalQuantity >=
tier.min_quantity
) {

currentTier =
tier;

} else {

break;
}
}
}

const isApplied =
hasPromotion &&
appliedPromotionId ===
promotion.id;

return (

<div
key={promotion.id}
className={`rounded-2xl border px-4 py-3 transition ${
isApplied
? "border-emerald-200 bg-emerald-50/70"
: "border-neutral-200 bg-white"
}`}
>

<div className="flex flex-wrap items-center justify-between gap-2">

<div className="min-w-0">

<div className="flex flex-wrap items-center gap-2">

<span className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
isQuantityPromotion
? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
: "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200"
}`}>

{
isQuantityPromotion
? "Por cantidad"
: "Precio fijo"
}

</span>

{isApplied && (

<span className="inline-flex min-h-6 items-center rounded-full bg-emerald-600 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">

Aplicada

</span>

)}

</div>

{promotion.name && (

<p className="mt-2 truncate text-sm font-medium text-neutral-900">

{promotion.name}

</p>

)}

</div>

{!isQuantityPromotion &&
Number.isFinite(
Number(
promotion.promotional_price
)
) && (

<p className="text-sm font-semibold text-neutral-950">

{
formatPrice(
promotion.promotional_price
)
}

</p>

)}

{isQuantityPromotion &&
currentTier && (

<p className="text-sm font-semibold text-emerald-700">

{
`${formatPrice(
currentTier.unit_price
)} c/u`
}

</p>

)}

</div>

{isQuantityPromotion && (

<div className="mt-3 flex flex-wrap gap-2">

{promotion.tiers.map((tier) => (

<span
key={
tier.id ||
`${promotion.id}-${tier.min_quantity}`
}
className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium ${
currentTier &&
Number(
currentTier.min_quantity
) ===
Number(
tier.min_quantity
)
? "bg-emerald-100 text-emerald-800"
: "bg-neutral-100 text-neutral-600"
}`}
>

{`Desde ${tier.min_quantity} ${
Number(
tier.min_quantity
) === 1
? "lámina"
: "láminas"
} · ${formatPrice(
tier.unit_price
)} c/u`}

</span>

))}

</div>

)}

</div>

);

})}

</div>

</div>

)}

{
/* ===============================

*                    PROCEDENCIA*

*                =============================== */}

{isKisafixAdhesive ? (

<div className="mt-4">

<img

src="/images/origins/made-in-brasil.png"

alt="Made in Brasil"

className="h-auto w-[150px] object-contain sm:w-[165px]"

loading="eager"

/>

</div>

) : (

<div className="mt-4 flex items-center gap-4">

<span className="text-xs font-medium text-neutral-500">

Procedencia

</span>

{isKarikal ? (

<img

src="/images/origins/made-in-argentina.webp"

alt="Procedencia Argentina - Made in Argentina"

className="h-auto w-[132px] object-contain"

loading="eager"

/>

) : (

<img

src="/images/origins/made-in-italy.png"

alt="Procedencia Italia - Made in Italy"

className="h-auto w-[112px] object-contain"

loading="eager"

/>

)}

</div>

)}

{!isKisafixAdhesive && (

<p className="mt-3 text-xs font-semibold leading-5 text-red-600">

{toneNotice}

</p>

)}

</div>

{
/* ===============================*

*                  DISPONIBILIDAD*

*              =============================== */
}

<div className="mt-6 border-y border-neutral-200 py-5">

<div className="flex items-center justify-between gap-4">

<span className="text-sm text-neutral-500">

Disponibilidad

</span>

<span

className={`text-sm font-medium ${

!product.in_stock ||

availableStock <= 0

? "text-neutral-400"

: availableStock === 1

? "text-amber-600"

: "text-neutral-950"

}`}

>

{

!product.in_stock ||

availableStock <= 0

? "Sin stock"

: availableStock === 1

? "Solo 1 unidad en stock"

: "Disponible"

}

</span>

</div>

</div>

{
/* =================================*

*                  CANTIDAD + AGREGAR AL CARRITO*

*              ================================= */
}

<div className="mt-8 flex items-stretch gap-3">

<div className={`flex min-h-14 w-[136px] shrink-0 items-center justify-between rounded-full border px-1 ${

canAdd

? "border-neutral-300 bg-white"

: "border-neutral-200 bg-neutral-50"

}`}>

<button

type="button"

onClick={

handleDecreaseQuantity

}

disabled={

!canAdd ||

quantityToAdd <= 1

}

aria-label="Disminuir cantidad"

className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-light text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"

>

−

</button>

<span

className={`min-w-8 text-center text-sm font-medium ${

canAdd

? "text-neutral-950"

: "text-neutral-400"

}`}

aria-live="polite"

>

{quantityToAdd}

</span>

<button

type="button"

onClick={

handleIncreaseQuantity

}

disabled={

!canAdd ||

quantityToAdd >=

remainingStock

}

aria-label="Aumentar cantidad"

className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-light text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"

>

+

</button>

</div>

<button

type="button"

onClick={

handleAddToCart

}

disabled={

!canAdd

}

className={`flex min-h-14 flex-1 items-center justify-center rounded-full px-5 text-sm font-medium transition duration-300 sm:px-6 sm:text-base ${

canAdd

? "bg-black text-white hover:bg-neutral-800"

: "cursor-not-allowed bg-neutral-100 text-neutral-400"

}`}

>

{

!product.in_stock ||

availableStock <= 0

? "Sin stock"

: currentQuantity >=

availableStock

? "Máximo disponible en carrito"

: quantityToAdd > 1

? `Agregar ${quantityToAdd} al carrito`

: "Agregar al carrito"

}

</button>

</div>

{
/* =================================*

*                  VER STOCK*

*              ================================= */
}

{product.in_stock && (

<div className="mt-3">

<button

type="button"

onClick={() =>

setShowStock(

(
current
) =>

!current

)

}

aria-expanded={

showStock

}

className="flex min-h-13 w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-950 transition duration-300 hover:border-neutral-950"

>

{showStock

? "Ocultar stock disponible"

: "Ver stock disponible"}

</button>

<div

className={`grid transition-all duration-300 ${

showStock

? "grid-rows-[1fr] opacity-100"

: "grid-rows-[0fr] opacity-0"

}`}

>

<div className="overflow-hidden">

<div className="mt-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4">

<div className="flex items-center justify-between gap-4">

<span className="text-sm text-neutral-500">

Stock disponible

</span>

<span

className={`text-sm font-medium ${

availableStock === 1

? "text-amber-600"

: "text-neutral-950"

}`}

>

{

stockText

}

</span>

</div>

</div>

</div>

</div>

</div>

)}

{!isAdhesiveProduct && (

<>
{
/* =================================*

*                  FICHA TÉCNICA*

*              ================================= */
}

<div className="mt-8 border-t border-neutral-200 pt-8">

<p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">

Ficha técnica

</p>

<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

{technicalMeasurements.map(

(
item
) => (

<div

key={

item.label

}

className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"

>

<p className="text-xs text-neutral-400">

{

item.label

}

</p>

<p

className={`mt-2 text-sm font-medium ${

item.value ===

"No informado"

? "text-neutral-400"

: "text-neutral-950"

}`}

>

{

item.value

}

</p>

</div>

)

)}

</div>

{
/* ===============================*

*                    ACABADO*

*                =============================== */
}

{product.finish && (

<div className="mt-3 flex items-center justify-between gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">

<span className="text-xs text-neutral-400">

Acabado

</span>

<span className="text-sm font-medium text-neutral-950">

{

product.finish

}

</span>

</div>

)}

</div>

</>

)}

{
/* =================================*

*                  COMPARTIR*

*              ================================= */
}

<div className="mt-8 border-t border-neutral-200 pt-7">

<p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">

Compartir producto

</p>

<div className="mt-4 flex items-center gap-3">

{
/* WHATSAPP */
}

<button

type="button"

onClick={

handleShareWhatsApp

}

aria-label="Compartir por WhatsApp"

title="Compartir por WhatsApp"

className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition duration-300 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"

>

<svg

viewBox="0 0 24 24"

aria-hidden="true"

className="h-5 w-5"

fill="currentColor"

>

<path d="M12.04 2C6.52 2 2.03 6.48 2.03 12c0 1.76.46 3.49 1.34 5.01L2 22l5.12-1.34A9.95 9.95 0 0 0 12.04 22C17.55 22 22 17.52 22 12S17.55 2 12.04 2Zm0 18.18a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.04.8.81-2.96-.2-.31A8.19 8.19 0 0 1 3.87 12a8.18 8.18 0 1 1 8.17 8.18Zm4.49-6.13c-.25-.13-1.46-.72-1.69-.8-.23-.09-.4-.13-.57.12-.17.25-.65.8-.8.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.57-1.38-.78-1.89-.21-.5-.42-.43-.57-.44h-.49c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.02 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.52.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.17.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z" />

</svg>

</button>

{
/* INSTAGRAM */
}

<button

type="button"

onClick={

handleShareInstagram

}

aria-label="Compartir por Instagram"

title="Compartir por Instagram"

className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition duration-300 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"

>

<svg

viewBox="0 0 24 24"

aria-hidden="true"

className="h-5 w-5"

fill="none"

stroke="currentColor"

strokeWidth="1.8"

>

<rect

x="3"

y="3"

width="18"

height="18"

rx="5"

/>

<circle

cx="12"

cy="12"

r="4"

/>

<circle

cx="17.5"

cy="6.5"

r="1"

fill="currentColor"

stroke="none"

/>

</svg>

</button>

{
/* FACEBOOK */
}

<button

type="button"

onClick={

handleShareFacebook

}

aria-label="Compartir por Facebook"

title="Compartir por Facebook"

className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition duration-300 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"

>

<svg

viewBox="0 0 24 24"

aria-hidden="true"

className="h-5 w-5"

fill="currentColor"

>

<path d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1.01.28-1.7 1.74-1.7H17V2.47c-.31-.04-1.39-.13-2.65-.13-2.62 0-4.42 1.6-4.42 4.54V9.5H7v3.5h2.93v9h3.57Z" />

</svg>

</button>

</div>

{shareFeedback && (

<p className="mt-3 text-xs text-neutral-500">

{

shareFeedback

}

</p>

)}

</div>

</section>


{
/* =====================================*

*       DESCRIPCIÓN COMPLETA RESPONSIVE*

*       Después de información producto*

*          ===================================== */
}

{fullDescriptionWithoutToneNotice && (

<section className="order-3 mt-8 border-t border-neutral-200 pt-8 xl:hidden">

<p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">

Información del producto

</p>

<h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950">

Descripción

</h2>

<p className="mt-6 whitespace-pre-line text-[15px] leading-8 text-neutral-600">

{formatProductDescription(fullDescriptionWithoutToneNotice)}

</p>

</section>

)}

</div>



</div>

</main>

{
/* =========================================*

*          VISOR / LIGHTBOX DE IMAGEN*

*      ========================================= */
}

{isZoomOpen &&

canZoomSelectedImage &&

mainImageUrl && (

<div

className="fixed inset-0 z-[200] flex flex-col bg-black/95"

role="dialog"

aria-modal="true"

aria-label={`Imagen ampliada de ${
product
.name}`}

onClick={

handleCloseZoom

}

>

{
/* =====================================*

*              BARRA SUPERIOR*

*          ===================================== */
}

<div className="relative z-20 flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">

<div className="min-w-0 pr-5">

<p className="truncate text-sm font-medium text-white">

{

product
.name

}

</p>

<p className="mt-1 text-xs text-white/50">

{

Math.round(

zoomScale * 100

)

}

% de zoom

</p>

</div>

<button

type="button"

onClick={

handleCloseZoom

}

aria-label="Cerrar imagen ampliada"

className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-light text-white transition hover:bg-white hover:text-black"

>

×

</button>

</div>

{
/* =====================================*

*              ÁREA DE IMAGEN*

*          ===================================== */
}

<div

className="relative flex min-h-0 flex-1 overflow-auto p-4 sm:p-8"

onClick={(
event
) =>

event.stopPropagation()

}

>

<div className="m-auto flex min-h-full min-w-full items-center justify-center">

<img

src={

mainImageUrl

}

alt={

mainImageAlt

}

draggable="false"

onDoubleClick={

handleDoubleClickZoom

}

className="max-h-[calc(100vh-11rem)] max-w-[90vw] select-none object-contain"

style={{

transform:

`scale(${zoomScale})`,

transformOrigin:

"center center",

transition:

"transform 180ms ease",

}}

/>

</div>

</div>

{
/* =====================================*

*              CONTROLES DE ZOOM*

*          ===================================== */
}

<div

className="relative z-20 flex shrink-0 items-center justify-center pb-5 pt-3"

onClick={(
event
) =>

event.stopPropagation()

}

>

<div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/70 p-1.5 shadow-xl backdrop-blur">

<button

type="button"

onClick={

handleZoomOut

}

disabled={

zoomScale <= 1

}

aria-label="Reducir zoom"

className="flex h-11 w-11 items-center justify-center rounded-full text-2xl font-light text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30"

>

−

</button>

<button

type="button"

onClick={

handleResetZoom

}

className="min-w-[72px] rounded-full px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/15 hover:text-white"

>

1:1

</button>

<button

type="button"

onClick={

handleZoomIn

}

disabled={

zoomScale >= 4

}

aria-label="Aumentar zoom"

className="flex h-11 w-11 items-center justify-center rounded-full text-2xl font-light text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30"

>

+

</button>

</div>

</div>

</div>

)}

</>

);

}


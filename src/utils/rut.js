export function cleanChileanRut(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^0-9K]/g, "");
}

export function validateChileanRut(value) {
  const cleaned = cleanChileanRut(value);

  if (cleaned.length < 2) {
    return false;
  }

  const body = cleaned.slice(0, -1);
  const verifier = cleaned.slice(-1);

  if (!/^\d{1,9}$/.test(body)) {
    return false;
  }

  if (Number(body) <= 0) {
    return false;
  }

  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedVerifier =
    remainder === 11
      ? "0"
      : remainder === 10
        ? "K"
        : String(remainder);

  return verifier === expectedVerifier;
}

export function formatChileanRut(value) {
  const cleaned = cleanChileanRut(value);

  if (!cleaned) {
    return "";
  }

  if (cleaned.length === 1) {
    return cleaned;
  }

  const body = cleaned.slice(0, -1);
  const verifier = cleaned.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${verifier}`;
}

export function getChileanRutValidation(value) {
  const cleaned = cleanChileanRut(value);

  return {
    cleaned,
    formatted: formatChileanRut(value),
    valid: validateChileanRut(value),
  };
}

// Apenas agenda a expiração local; a assinatura e a sessão são validadas pela API.
export const clinicTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "clinic" && typeof payload.exp === "number" && Number.isFinite(payload.exp)
      ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

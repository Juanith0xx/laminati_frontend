import { apiRequest } from "@/services/api";

export const sendContactMessage = async (payload) => {
  return apiRequest("/contact", {
    method: "POST",
    body: payload,
  });
};

export function errorResponse(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

export function successResponse(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
  };
}

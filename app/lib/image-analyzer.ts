export async function analyzeFoodImage(_image: File): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return ["egg", "tomato", "onion"];
}

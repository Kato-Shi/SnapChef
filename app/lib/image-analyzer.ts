export async function analyzeFoodImage(_image: File): Promise<string[]> {
  void _image;
  await new Promise((resolve) => setTimeout(resolve, 700));
  return ["egg", "tomato", "onion"];
}

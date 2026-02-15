export interface CustomCategory {
  id: string;
  familyId: string;
  label: string;
  emoji: string;
  colorScheme: string; // key into COLOR_SCHEMES
}

export const COLOR_SCHEMES: Record<
  string,
  { color: string; bgColor: string; borderColor: string }
> = {
  rood: { color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-400" },
  oranje: { color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-400" },
  geel: { color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-400" },
  groen: { color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-400" },
  blauw: { color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-400" },
  paars: { color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-400" },
  roze: { color: "text-pink-700", bgColor: "bg-pink-50", borderColor: "border-pink-400" },
  grijs: { color: "text-gray-700", bgColor: "bg-gray-50", borderColor: "border-gray-400" },
};

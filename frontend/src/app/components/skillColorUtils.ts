const SKILL_COLORS = [
  { bg: 'bg-[#E8F0FE]', text: 'text-[#174EA6]', border: 'border-[#8AB4F8]', accent: '#1A73E8' },
  { bg: 'bg-[#E6F4EA]', text: 'text-[#0D652D]', border: 'border-[#81C995]', accent: '#1E8E3E' },
  { bg: 'bg-[#FEF7E0]', text: 'text-[#B06000]', border: 'border-[#FDD663]', accent: '#E37400' },
  { bg: 'bg-[#FCE8E6]', text: 'text-[#A50E0E]', border: 'border-[#F28B82]', accent: '#D93025' },
  { bg: 'bg-[#F3E8FD]', text: 'text-[#6A1B9A]', border: 'border-[#C58AF9]', accent: '#9334E6' },
  { bg: 'bg-[#E0F7FA]', text: 'text-[#006064]', border: 'border-[#80DEEA]', accent: '#00838F' },
  { bg: 'bg-[#FCE4EC]', text: 'text-[#AD1457]', border: 'border-[#F48FB1]', accent: '#D81B60' },
  { bg: 'bg-[#EDE7F6]', text: 'text-[#4527A0]', border: 'border-[#B39DDB]', accent: '#5E35B1' },
  { bg: 'bg-[#FFF3E0]', text: 'text-[#A84300]', border: 'border-[#FFB74D]', accent: '#F57C00' },
  { bg: 'bg-[#E0F2F1]', text: 'text-[#004D40]', border: 'border-[#80CBC4]', accent: '#00796B' },
  { bg: 'bg-[#F1F8E9]', text: 'text-[#33691E]', border: 'border-[#AED581]', accent: '#689F38' },
  { bg: 'bg-[#E3F2FD]', text: 'text-[#0D47A1]', border: 'border-[#90CAF9]', accent: '#1565C0' },
];

const CATEGORY_COLOR_INDEX: Record<string, number> = {
  'apis & integration': 2,
  architecture: 4,
  'architecture & design': 4,
  databases: 9,
  'devops & cloud': 0,
  frameworks: 5,
  languages: 1,
  security: 7,
  'soft skills': 6,
  testing: 8,
  tools: 10,
  mobile: 11,
};

export function hashLabel(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

export function getSkillColor(colorIndex: number) {
  return SKILL_COLORS[colorIndex % SKILL_COLORS.length];
}

export function getSkillCategoryColorIndex(category: string): number {
  const normalized = category.trim().toLowerCase();
  return CATEGORY_COLOR_INDEX[normalized] ?? hashLabel(category);
}

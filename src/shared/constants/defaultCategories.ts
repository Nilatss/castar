/**
 * CaStar — Default transaction categories
 * Localized names are handled via i18n keys
 */

export interface DefaultCategory {
  nameKey: string; // i18n key
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export const defaultCategories: DefaultCategory[] = [
  // === Expense categories ===
  { nameKey: 'categories.food', icon: 'food', color: '#F55858', type: 'expense' },
  { nameKey: 'categories.transport', icon: 'car', color: '#4B8DF5', type: 'expense' },
  { nameKey: 'categories.housing', icon: 'home', color: '#FAAD14', type: 'expense' },
  { nameKey: 'categories.utilities', icon: 'flash', color: '#FBC44B', type: 'expense' },
  { nameKey: 'categories.entertainment', icon: 'game-controller', color: '#CC830C', type: 'expense' },
  { nameKey: 'categories.health', icon: 'medical', color: '#17E56C', type: 'expense' },
  { nameKey: 'categories.education', icon: 'book', color: '#1D62E5', type: 'expense' },
  { nameKey: 'categories.clothing', icon: 'shirt', color: '#E52222', type: 'expense' },
  { nameKey: 'categories.gifts', icon: 'gift', color: '#F03D3D', type: 'expense' },
  { nameKey: 'categories.other_expense', icon: 'ellipsis-horizontal', color: '#808080', type: 'expense' },

  // === Income categories ===
  { nameKey: 'categories.salary', icon: 'briefcase', color: '#09AD4D', type: 'income' },
  { nameKey: 'categories.freelance', icon: 'laptop', color: '#0FC95C', type: 'income' },
  { nameKey: 'categories.investments', icon: 'trending-up', color: '#3DF08A', type: 'income' },
  { nameKey: 'categories.other_income', icon: 'ellipsis-horizontal', color: '#58F59E', type: 'income' },
];

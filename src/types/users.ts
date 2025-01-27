export interface UserData {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  favorites: string[]; // osakkeiden ticker symbolit
  lastLogin?: string;
}
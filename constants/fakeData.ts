export type Category = {
  id: string;
  name: string;
  icon: string;
};

export const categories: Category[] = [
  { id: '1', name: 'Hôtels', icon: 'bed-outline' },
  { id: '2', name: 'Appartements', icon: 'home-outline' },
  { id: '3', name: 'Maisons', icon: 'business-outline' },
  { id: '4', name: 'Restaurants', icon: 'restaurant-outline' },
  { id: '5', name: 'Bars', icon: 'wine-outline' },
  { id: '6', name: 'Salles', icon: 'people-outline' },
];

export type Listing = {
  id: string;
  title: string;
  categoryId: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  imageUrl: string;
  isPopular?: boolean;
};

export const listings: Listing[] = [
  {
    id: '1',
    title: 'Pullman Kinshasa Grand Hôtel',
    categoryId: '1', // Hôtels
    location: 'Gombe, Kinshasa',
    price: 250,
    rating: 4.8,
    reviews: 342,
    imageUrl: 'https://images.unsplash.com/photo-1566073171526-87316538a11f?auto=format&fit=crop&q=80&w=800',
    isPopular: true,
  },
  {
    id: '2',
    title: 'Appartement de luxe vue Fleuve',
    categoryId: '2', // Appartements
    location: 'Gombe, Kinshasa',
    price: 150,
    rating: 4.9,
    reviews: 128,
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
    isPopular: true,
  },
  {
    id: '3',
    title: 'Rotana Kin Plaza',
    categoryId: '1', // Hôtels
    location: 'Gombe, Kinshasa',
    price: 320,
    rating: 4.7,
    reviews: 256,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-c6a4d14d8373?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '4',
    title: 'Chez Ntemba',
    categoryId: '5', // Bars
    location: 'Gombe, Kinshasa',
    price: 50,
    rating: 4.5,
    reviews: 89,
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '5',
    title: 'A Casa Mia',
    categoryId: '4', // Restaurants
    location: 'Gombe, Kinshasa',
    price: 80,
    rating: 4.6,
    reviews: 210,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    isPopular: true,
  },
  {
    id: '6',
    title: 'Salle des Fêtes Romeo Golf',
    categoryId: '6', // Salles
    location: 'Gombe, Kinshasa',
    price: 1500,
    rating: 4.7,
    reviews: 45,
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '7',
    title: 'Studio Moderne Macampagne',
    categoryId: '2', // Appartements
    location: 'Ngaliema, Kinshasa',
    price: 80,
    rating: 4.4,
    reviews: 56,
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1e52db0832?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '8',
    title: 'Villa avec Piscine Privée',
    categoryId: '3', // Maisons
    location: 'Binza, Kinshasa',
    price: 450,
    rating: 4.9,
    reviews: 32,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
    isPopular: true,
  }
];

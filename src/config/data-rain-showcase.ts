export interface ShowcaseAsset {
  id: string;
  title: string;
  category: "coordination" | "community" | "field-work";
  imageUrl: string;
  description: string;
}

export const SHOWCASE_ASSETS: ShowcaseAsset[] = [
  {
    id: "field-coordination",
    title: "Field Operations Command",
    category: "coordination",
    imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    description: "Volunteers and technical organizers planning real-time distribution zones",
  },
  {
    id: "community-action",
    title: "Verified Community Assembly",
    category: "community",
    imageUrl: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80",
    description: "Civic members verifying consensus bulletins on mobile terminals",
  },
  {
    id: "volunteer-response",
    title: "Rapid Emergency Response",
    category: "field-work",
    imageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80",
    description: "Field volunteers deploying humanitarian assistance supplies across sectors",
  },
];

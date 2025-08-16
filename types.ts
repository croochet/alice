// Type to manage the different screens/states of the application flow.
export type Screen = 'INITIAL' | 'PROCESSING' | 'RESULT';

// Interface for the processed album data used within the application.
export interface Album {
  name: string;
  artist: string;
  playcount: string;
  imageUrl: string;
}

// New, more granular types for generative art parameters
export type GridType = 'uniform' | 'hierarchical';
export type PatternType = 'alternating_triangles' | 'solid_blocks' | 'geometric_shapes';
export type PatternVariation = 'none' | 'randomized_scale' | 'randomized_orientation' | 'fractal';
export type ColorApplication = 'alternating_fixed' | 'alternating_random' | 'solid_block';

// Redefined interface for the parameters that define the generative art
export interface ArtParams {
  grid_type: GridType;
  grid_cols?: number; // For uniform grid
  grid_rows?: number; // For uniform grid
  pattern_type: PatternType;
  pattern_variation: PatternVariation;
  color_application: ColorApplication;
  colors: string[]; // Palette
  line_sharpness: number; // 0.0 to 1.0, though visually implemented as 1.0 for now
}

// Interface for the complete art design object returned by the AI
export interface ArtDesign {
  title: string;
  description: string;
  params: ArtParams;
}

// Interface representing the structure of a single album from the Last.fm API response.
export interface LastFmAlbum {
  artist: {
    name: string;
  };
  image: {
    '#text': string;
    size: 'small' | 'medium' | 'large' | 'extralarge';
  }[];
  playcount: string;
  name: string;
}

// Interface for the 'topalbums' object in the Last.fm API response.
export interface LastFmTopAlbums {
  album: LastFmAlbum[];
}

// Interface for the root of the Last.fm API response.
export interface LastFmApiResponse {
  topalbums?: LastFmTopAlbums;
  error?: number;
  message?: string;
}
export type RootStackParamList = {
  Home: undefined;
  Editor: { projectId?: string; autoPick?: 'gallery' | 'camera' };
  Preview: { projectId?: string };
  Projects: undefined;
  CropScreen: { itemId: string; imageUri: string };
};

export type BottomTabParamList = {
  HomeTab: undefined;
  ProjectsTab: undefined;
};

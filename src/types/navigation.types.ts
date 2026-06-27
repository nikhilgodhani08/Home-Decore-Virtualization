export type RootStackParamList = {
  Home: undefined;
  Editor: { projectId?: string };
  Preview: undefined;
  Projects: undefined;
  CropScreen: { imageUri: string };
};

export type BottomTabParamList = {
  HomeTab: undefined;
  ProjectsTab: undefined;
};

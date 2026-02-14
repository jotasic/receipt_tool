declare module 'expo-image-crop-editor' {
  import { ComponentType } from 'react';

  interface ImageEditorProps {
    visible: boolean;
    onCloseEditor: () => void;
    imageUri: string;
    fixedCropAspectRatio?: number;
    lockAspectRatio?: boolean;
    minimumCropDimensions?: { width: number; height: number };
    onEditingComplete: (result: { uri: string }) => void;
    mode?: 'full' | 'crop-only';
    allowedTransformOperations?: string[];
    allowedAdjustmentOperations?: string[];
  }

  export const ImageEditor: ComponentType<ImageEditorProps>;
}

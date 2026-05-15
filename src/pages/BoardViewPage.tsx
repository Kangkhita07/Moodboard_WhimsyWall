import {
  DragEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import corkBoardImage from '../../Animation asset/corkboard.png';
import whiteBoardImage from '../../Animation asset/whiteboard.png';
import type { BoardType } from '../App';

type BoardViewPageProps = {
  boardType: BoardType;
  onBack: () => void;
};

type DrawerImage = {
  id: number;
  name: string;
  imageUrl?: string;
};

type CanvasImage = {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  imageUrl?: string;
  aspectRatio?: number;
};

type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw';

type DragState =
  | {
      type: 'move';
      id: number;
      offsetX: number;
      offsetY: number;
    }
  | {
      type: 'resize';
      id: number;
      direction: ResizeDirection;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
      startImageX: number;
      startImageY: number;
    };

type ReorderState = {
  id: number;
};

type ImageBounds = Pick<CanvasImage, 'x' | 'y' | 'width' | 'height'>;

type HistorySnapshot = {
  canvasImages: CanvasImage[];
  drawerImages: DrawerImage[];
  selectedImageId: number | null;
};

type PanState = {
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

const initialDrawerImages: DrawerImage[] = [
  { id: 1, name: 'Images 1' },
  { id: 2, name: 'Images 2' },
  { id: 3, name: 'Images 3' },
];

const initialCanvasImages: CanvasImage[] = [
  { id: 1, name: 'Image 1', x: 16, y: 18, width: 15, height: 16, color: '#ffd6ef' },
  { id: 2, name: 'Image 2', x: 58, y: 34, width: 15, height: 16, color: '#d9f0ff' },
  { id: 3, name: 'Image 3', x: 35, y: 62, width: 15, height: 16, color: '#fff0ba' },
];

const MIN_IMAGE_WIDTH = 9;
const MIN_IMAGE_HEIGHT = 10;
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;
const UPLOAD_IMAGE_WIDTH = 18;
const UPLOAD_IMAGE_HEIGHT = 18;
const supportedImageTypes = new Set([
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);
const boardCanvasSize = {
  width: 'min(920px, calc((100vh - 8.5rem) * 1.5), 100%)',
  maxHeight: 'calc(100vh - 8.5rem)',
};

const imagesOverlap = (first: ImageBounds, second: ImageBounds) =>
  first.x < second.x + second.width &&
  first.x + first.width > second.x &&
  first.y < second.y + second.height &&
  first.y + first.height > second.y;

const getContainedImageSize = (
  imageAspectRatio: number,
  boardAspectRatio: number,
) => {
  if (imageAspectRatio >= boardAspectRatio) {
    return {
      width: UPLOAD_IMAGE_WIDTH,
      height: (UPLOAD_IMAGE_WIDTH * boardAspectRatio) / imageAspectRatio,
    };
  }

  return {
    width: (UPLOAD_IMAGE_HEIGHT * imageAspectRatio) / boardAspectRatio,
    height: UPLOAD_IMAGE_HEIGHT,
  };
};

function ImageIcon({ imageUrl }: { imageUrl?: string }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-sm bg-[#294350]">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M4 18l5.5-6 4 4.3 2.5-3.1L20 18H4z" fill="#82b78f" />
          <circle cx="9" cy="8" r="2" fill="#f3e75b" />
        </svg>
      )}
    </span>
  );
}

function DragHandleIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center gap-1"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#811bdc]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#811bdc]" />
      <span className="h-1.5 w-1.5 rounded-full bg-[#811bdc]" />
    </span>
  );
}

function BoardViewPage({ boardType, onBack }: BoardViewPageProps) {
  const [title, setTitle] = useState('Untitled Moodboard');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 768,
  );
  const [drawerImages, setDrawerImages] = useState(initialDrawerImages);
  const [canvasImages, setCanvasImages] = useState(initialCanvasImages);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(1);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [reorderState, setReorderState] = useState<ReorderState | null>(null);
  const [zoom, setZoom] = useState(100);
  const [activeZoomControl, setActiveZoomControl] = useState<
    'in' | 'out' | null
  >(null);
  const [editingImageNameId, setEditingImageNameId] = useState<number | null>(
    null,
  );
  const [clipboardImage, setClipboardImage] = useState<CanvasImage | null>(null);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panState, setPanState] = useState<PanState | null>(null);
  const [isDraggingFileOverCanvas, setIsDraggingFileOverCanvas] =
    useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const selectedBoardImage = useMemo(
    () => (boardType === 'cork' ? corkBoardImage : whiteBoardImage),
    [boardType],
  );

  const moveDrawerImageAbove = (activeId: number, targetId: number) => {
    setDrawerImages((images) => {
      const fromIndex = images.findIndex((image) => image.id === activeId);
      const toIndex = images.findIndex((image) => image.id === targetId);

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex - 1) {
        return images;
      }

      const nextImages = [...images];
      const [movedImage] = nextImages.splice(fromIndex, 1);
      const adjustedToIndex = nextImages.findIndex(
        (image) => image.id === targetId,
      );
      nextImages.splice(Math.max(adjustedToIndex, 0), 0, movedImage);
      return nextImages;
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setActiveZoomControl(direction);
    setZoom((currentZoom) =>
      direction === 'in'
        ? Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM)
        : Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM),
    );
    window.setTimeout(() => setActiveZoomControl(null), 180);
  };

  const saveHistorySnapshot = () => {
    setHistory((snapshots) => [
      ...snapshots,
      { canvasImages, drawerImages, selectedImageId },
    ]);
  };

  const deleteImage = (imageId: number) => {
    saveHistorySnapshot();
    setCanvasImages((images) => images.filter((image) => image.id !== imageId));
    setDrawerImages((images) => images.filter((image) => image.id !== imageId));
    setSelectedImageId((currentId) => (currentId === imageId ? null : currentId));
  };

  const renameImage = (imageId: number, nextName: string) => {
    const cleanName = nextName.trim() || `Image ${imageId}`;

    setDrawerImages((images) =>
      images.map((image) =>
        image.id === imageId ? { ...image, name: cleanName } : image,
      ),
    );
    setCanvasImages((images) =>
      images.map((image) =>
        image.id === imageId ? { ...image, name: cleanName } : image,
      ),
    );
    setEditingImageNameId(null);
  };

  const hasImageFile = (dataTransfer: DataTransfer) =>
    Array.from(dataTransfer.items).some(
      (item) => item.kind === 'file' && supportedImageTypes.has(item.type),
    );

  const handleCanvasFileDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!hasImageFile(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingFileOverCanvas(true);
  };

  const handleCanvasFileDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDraggingFileOverCanvas(false);
    }
  };

  const addUploadedImageToCanvas = (
    file: File | Blob,
    name: string,
    centerPosition = { x: 50, y: 50 },
  ) => {
    const boardRect = boardRef.current?.getBoundingClientRect();

    if (!supportedImageTypes.has(file.type) || !boardRect) {
      return;
    }

    saveHistorySnapshot();

    const nextId = Date.now() + Math.floor(Math.random() * 1000);
    const imageUrl = URL.createObjectURL(file);
    const cleanName = name.replace(/\.[^/.]+$/, '').trim() || `Image ${nextId}`;
    const previewImage = new Image();

    previewImage.onload = () => {
      const aspectRatio =
        previewImage.naturalWidth > 0 && previewImage.naturalHeight > 0
          ? previewImage.naturalWidth / previewImage.naturalHeight
          : 1;
      const { width, height } = getContainedImageSize(
        aspectRatio,
        boardRect.width / boardRect.height,
      );
      const nextImage = {
        id: nextId,
        name: cleanName,
        x: Math.min(Math.max(centerPosition.x - width / 2, 0), 100 - width),
        y: Math.min(Math.max(centerPosition.y - height / 2, 0), 100 - height),
        width,
        height,
        color: 'transparent',
        imageUrl,
        aspectRatio,
      };

      setCanvasImages((images) => [...images, nextImage]);
      setDrawerImages((images) => [
        { id: nextId, name: cleanName, imageUrl },
        ...images,
      ]);
      setSelectedImageId(nextId);
    };

    previewImage.onerror = () => {
      URL.revokeObjectURL(imageUrl);
    };

    previewImage.src = imageUrl;
  };

  const handleCanvasFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFileOverCanvas(false);

    const droppedFile = Array.from(event.dataTransfer.files).find((file) =>
      supportedImageTypes.has(file.type),
    );
    const boardRect = boardRef.current?.getBoundingClientRect();

    if (!droppedFile || !boardRect) {
      return;
    }

    const dropX = ((event.clientX - boardRect.left) / boardRect.width) * 100;
    const dropY = ((event.clientY - boardRect.top) / boardRect.height) * 100;

    addUploadedImageToCanvas(droppedFile, droppedFile.name, {
      x: dropX,
      y: dropY,
    });
  };

  const handlePointerDown = (
    event: PointerEvent<HTMLDivElement>,
    image: CanvasImage,
  ) => {
    const boardRect = boardRef.current?.getBoundingClientRect();

    if (!boardRect) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    saveHistorySnapshot();
    setSelectedImageId(image.id);
    const currentX = (image.x / 100) * boardRect.width;
    const currentY = (image.y / 100) * boardRect.height;

    setDragState({
      type: 'move',
      id: image.id,
      offsetX: event.clientX - boardRect.left - currentX,
      offsetY: event.clientY - boardRect.top - currentY,
    });
  };

  const handleResizePointerDown = (
    event: PointerEvent<HTMLSpanElement>,
    image: CanvasImage,
    direction: ResizeDirection,
  ) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    saveHistorySnapshot();
    setSelectedImageId(image.id);
    setDragState({
      type: 'resize',
      id: image.id,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: image.width,
      startHeight: image.height,
      startImageX: image.x,
      startImageY: image.y,
    });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const boardRect = boardRef.current?.getBoundingClientRect();

    if (!dragState || !boardRect) {
      return;
    }

    if (dragState.type === 'move') {
      const activeImage = canvasImages.find((image) => image.id === dragState.id);

      if (!activeImage) {
        return;
      }

      const nextX =
        ((event.clientX - boardRect.left - dragState.offsetX) / boardRect.width) *
        100;
      const nextY =
        ((event.clientY - boardRect.top - dragState.offsetY) / boardRect.height) *
        100;

      setCanvasImages((images) => {
        const nextActiveImage = {
          ...activeImage,
          x: Math.min(Math.max(nextX, 0), 100 - activeImage.width),
          y: Math.min(Math.max(nextY, 0), 100 - activeImage.height),
        };
        const overlappedImages = images.filter(
          (image) =>
            image.id !== dragState.id && imagesOverlap(nextActiveImage, image),
        );

        if (overlappedImages.length > 0) {
          const targetImage = overlappedImages.sort((first, second) => {
            const firstIndex = drawerImages.findIndex(
              (image) => image.id === first.id,
            );
            const secondIndex = drawerImages.findIndex(
              (image) => image.id === second.id,
            );
            return firstIndex - secondIndex;
          })[0];

          moveDrawerImageAbove(dragState.id, targetImage.id);
        }

        return images.map((image) =>
          image.id === dragState.id ? nextActiveImage : image,
        );
      });
      return;
    }

    const deltaX = ((event.clientX - dragState.startX) / boardRect.width) * 100;
    const deltaY = ((event.clientY - dragState.startY) / boardRect.height) * 100;

    setCanvasImages((images) =>
      images.map((image) => {
        if (image.id !== dragState.id) {
          return image;
        }

        let nextX = dragState.startImageX;
        let nextY = dragState.startImageY;
        let nextWidth = dragState.startWidth;
        let nextHeight = dragState.startHeight;

        if (dragState.direction.includes('e')) {
          nextWidth = dragState.startWidth + deltaX;
        }

        if (dragState.direction.includes('s')) {
          nextHeight = dragState.startHeight + deltaY;
        }

        if (dragState.direction.includes('w')) {
          nextWidth = dragState.startWidth - deltaX;
          nextX = dragState.startImageX + deltaX;
        }

        if (dragState.direction.includes('n')) {
          nextHeight = dragState.startHeight - deltaY;
          nextY = dragState.startImageY + deltaY;
        }

        if (nextWidth < MIN_IMAGE_WIDTH) {
          nextX = dragState.direction.includes('w')
            ? dragState.startImageX + dragState.startWidth - MIN_IMAGE_WIDTH
            : nextX;
          nextWidth = MIN_IMAGE_WIDTH;
        }

        if (nextHeight < MIN_IMAGE_HEIGHT) {
          nextY = dragState.direction.includes('n')
            ? dragState.startImageY + dragState.startHeight - MIN_IMAGE_HEIGHT
            : nextY;
          nextHeight = MIN_IMAGE_HEIGHT;
        }

        if (image.imageUrl && image.aspectRatio) {
          const boardAspectRatio = boardRect.width / boardRect.height;
          const widthDelta = Math.abs(nextWidth - dragState.startWidth);
          const heightDelta = Math.abs(nextHeight - dragState.startHeight);
          const shouldLeadWithWidth =
            dragState.direction.includes('e') ||
            dragState.direction.includes('w')
              ? widthDelta >= heightDelta || !dragState.direction.includes('n') && !dragState.direction.includes('s')
              : false;

          if (shouldLeadWithWidth) {
            nextHeight = (nextWidth * boardAspectRatio) / image.aspectRatio;
          } else {
            nextWidth = (nextHeight * image.aspectRatio) / boardAspectRatio;
          }

          if (nextWidth < MIN_IMAGE_WIDTH) {
            nextWidth = MIN_IMAGE_WIDTH;
            nextHeight = (nextWidth * boardAspectRatio) / image.aspectRatio;
          }

          if (nextHeight < MIN_IMAGE_HEIGHT) {
            nextHeight = MIN_IMAGE_HEIGHT;
            nextWidth = (nextHeight * image.aspectRatio) / boardAspectRatio;
          }

          if (dragState.direction.includes('w')) {
            nextX =
              dragState.startImageX + dragState.startWidth - nextWidth;
          }

          if (dragState.direction.includes('n')) {
            nextY =
              dragState.startImageY + dragState.startHeight - nextHeight;
          }
        }

        nextX = Math.min(Math.max(nextX, 0), 100 - nextWidth);
        nextY = Math.min(Math.max(nextY, 0), 100 - nextHeight);
        nextWidth = Math.min(nextWidth, 100 - nextX);
        nextHeight = Math.min(nextHeight, 100 - nextY);

        if (image.imageUrl && image.aspectRatio) {
          const boardAspectRatio = boardRect.width / boardRect.height;
          const boundedWidthFromHeight =
            (nextHeight * image.aspectRatio) / boardAspectRatio;
          const boundedHeightFromWidth =
            (nextWidth * boardAspectRatio) / image.aspectRatio;

          if (boundedWidthFromHeight <= nextWidth) {
            nextWidth = boundedWidthFromHeight;
          } else {
            nextHeight = boundedHeightFromWidth;
          }

          if (dragState.direction.includes('w')) {
            nextX =
              dragState.startImageX + dragState.startWidth - nextWidth;
          }

          if (dragState.direction.includes('n')) {
            nextY =
              dragState.startImageY + dragState.startHeight - nextHeight;
          }

          nextX = Math.min(Math.max(nextX, 0), 100 - nextWidth);
          nextY = Math.min(Math.max(nextY, 0), 100 - nextHeight);
        }

        return {
          ...image,
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        };
      }),
    );
  };

  const stopDragging = () => {
    setDragState(null);
    setPanState(null);
  };

  const handleCanvasPanStart = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-canvas-item="true"]')) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedImageId(null);
    setPanState({
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: pan.x,
      startY: pan.y,
    });
  };

  const handleCanvasPanMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!panState) {
      return;
    }

    setPan({
      x: panState.startX + event.clientX - panState.startClientX,
      y: panState.startY + event.clientY - panState.startClientY,
    });
  };

  const handleDrawerDragStart = (
    event: DragEvent<HTMLDivElement>,
    image: DrawerImage,
  ) => {
    setReorderState({ id: image.id });
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDrawerDragOver = (
    event: DragEvent<HTMLDivElement>,
    targetImage: DrawerImage,
  ) => {
    event.preventDefault();

    if (!reorderState || reorderState.id === targetImage.id) {
      return;
    }

    setDrawerImages((images) => {
      const fromIndex = images.findIndex((image) => image.id === reorderState.id);
      const toIndex = images.findIndex((image) => image.id === targetImage.id);

      if (fromIndex < 0 || toIndex < 0) {
        return images;
      }

      const nextImages = [...images];
      const [movedImage] = nextImages.splice(fromIndex, 1);
      nextImages.splice(toIndex, 0, movedImage);
      return nextImages;
    });
  };

  const finishDrawerDrag = () => {
    setReorderState(null);
  };

  const finishTitleEditing = () => {
    setTitle((currentTitle) => currentTitle.trim() || 'Untitled Moodboard');
    setIsEditingTitle(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (!isModifierPressed) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'z') {
        event.preventDefault();
        setHistory((snapshots) => {
          const previousSnapshot = snapshots[snapshots.length - 1];

          if (!previousSnapshot) {
            return snapshots;
          }

          setCanvasImages(previousSnapshot.canvasImages);
          setDrawerImages(previousSnapshot.drawerImages);
          setSelectedImageId(previousSnapshot.selectedImageId);
          return snapshots.slice(0, -1);
        });
        return;
      }

      const selectedImage = canvasImages.find(
        (image) => image.id === selectedImageId,
      );

      if (!selectedImage) {
        return;
      }

      if (key === 'c') {
        event.preventDefault();
        setClipboardImage(selectedImage);
        return;
      }

      if (key === 'x') {
        event.preventDefault();
        setClipboardImage(selectedImage);
        deleteImage(selectedImage.id);
        return;
      }

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canvasImages,
    clipboardImage,
    drawerImages,
    history,
    selectedImageId,
  ]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      const clipboardItems = Array.from(event.clipboardData?.items ?? []);
      const imageItems = clipboardItems.filter(
        (item) => item.type.startsWith('image/') && supportedImageTypes.has(item.type),
      );

      if (imageItems.length > 0) {
        event.preventDefault();
        imageItems.forEach((item, index) => {
          const file = item.getAsFile();

          if (file) {
            addUploadedImageToCanvas(
              file,
              file.name || `Pasted image ${index + 1}`,
            );
          }
        });
        return;
      }

      if (!clipboardImage) {
        return;
      }

      event.preventDefault();
      saveHistorySnapshot();

      const nextId = Date.now() + Math.floor(Math.random() * 1000);
      const nextImage = {
        ...clipboardImage,
        id: nextId,
        name: `${clipboardImage.name} copy`,
        x: Math.min(clipboardImage.x + 4, 100 - clipboardImage.width),
        y: Math.min(clipboardImage.y + 4, 100 - clipboardImage.height),
      };

      setCanvasImages((images) => [...images, nextImage]);
      setDrawerImages((images) => [
        {
          id: nextId,
          name: nextImage.name,
          imageUrl: nextImage.imageUrl,
        },
        ...images,
      ]);
      setSelectedImageId(nextId);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [
    canvasImages,
    clipboardImage,
    drawerImages,
    history,
    selectedImageId,
  ]);

  return (
    <main
      className="h-screen overflow-hidden bg-[#f7eaf6] text-[#4f415b]"
      style={{
        fontFamily:
          "'Embolism Spark', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {!isDrawerOpen && (
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open image drawer"
          className="fixed left-4 top-5 z-40 grid h-11 w-11 place-items-center rounded-lg bg-[#e3a5e8] text-[#7d1bd3] shadow-lg transition hover:bg-[#dda0e3] focus:outline-none focus:ring-2 focus:ring-white/90"
        >
          <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[240px] max-w-[260px] flex-none flex-col bg-[#e3a5e8] px-4 py-4 shadow-2xl transition-all duration-300 ease-in-out md:shadow-none ${
          isDrawerOpen
            ? 'translate-x-0'
            : '-translate-x-full md:-translate-x-[240px]'
        }`}
      >
        <div className="mb-6 flex h-10 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close image drawer"
            className="grid h-9 w-9 place-items-center rounded-md text-[#7d1bd3] transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/90"
          >
            <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
            </svg>
          </button>
          <h2 className="text-xl font-bold">Images</h2>
        </div>

        <nav aria-label="Images added to board" className="space-y-2">
          {drawerImages.map((image) => (
            <div
              key={image.id}
              role="button"
              tabIndex={0}
              draggable
              onDragStart={(event) => handleDrawerDragStart(event, image)}
              onDragOver={(event) => handleDrawerDragOver(event, image)}
              onDragEnd={finishDrawerDrag}
              className={`flex h-11 w-full cursor-grab items-center gap-3 rounded-lg px-2 text-left text-lg font-semibold text-[#594461] transition active:cursor-grabbing ${
                reorderState?.id === image.id
                  ? 'scale-[1.02] bg-white/25 shadow-lg'
                  : 'hover:bg-white/15'
              } focus:outline-none focus:ring-2 focus:ring-white/80`}
            >
              <DragHandleIcon />
              <ImageIcon imageUrl={image.imageUrl} />
              {editingImageNameId === image.id ? (
                <input
                  autoFocus
                  defaultValue={image.name}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  onDragStart={(event) => event.preventDefault()}
                  onBlur={(event) => renameImage(image.id, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      renameImage(image.id, event.currentTarget.value);
                    }
                  }}
                  aria-label={`Rename ${image.name}`}
                  className="min-w-0 flex-1 rounded-md bg-white/45 px-2 text-lg font-semibold leading-none text-[#594461] outline-none focus:ring-2 focus:ring-white/80"
                />
              ) : (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingImageNameId(image.id);
                  }}
                  className="min-w-0 flex-1 truncate text-left leading-none focus:outline-none focus:ring-2 focus:ring-white/80"
                >
                  {image.name}
                </button>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteImage(image.id);
                }}
                aria-label={`Delete ${image.name}`}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold leading-none text-[#9b2f72] transition hover:bg-white/35 focus:outline-none focus:ring-2 focus:ring-[#9b2f72]"
              >
                x
              </button>
            </div>
          ))}
        </nav>
      </aside>

      <section
        className={`flex h-screen flex-1 flex-col py-4 pr-4 transition-all duration-300 ease-in-out sm:pr-8 lg:pr-12 ${
          isDrawerOpen
            ? 'pl-4 sm:pl-8 md:pl-[272px]'
            : 'pl-20 sm:pl-24 md:pl-24'
        }`}
      >
        <header className="relative z-50 grid min-h-14 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to board selection"
            className="grid h-11 w-11 place-items-center rounded-lg bg-white/45 text-[#66436d] shadow-sm transition hover:bg-white/75 focus:outline-none focus:ring-2 focus:ring-[#c489d7]"
          >
            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="mx-auto flex min-w-0 items-center justify-center text-xl font-bold sm:text-3xl">
            {isEditingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={finishTitleEditing}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    finishTitleEditing();
                  }
                }}
                aria-label="Moodboard title"
                className="min-w-0 bg-transparent text-center font-bold text-[#4f415b] outline-none"
                style={{ width: `${Math.max(title.length, 18)}ch` }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="min-w-0 rounded-md bg-transparent px-2 text-center font-bold text-[#4f415b] transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-[#c489d7]"
                aria-label="Edit moodboard title"
              >
                &lt; {title} &gt;
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              aria-label="Share moodboard"
              className="grid h-11 w-11 place-items-center rounded-lg text-[#8216d7] transition hover:bg-white/45 focus:outline-none focus:ring-2 focus:ring-[#c489d7]"
            >
              <svg aria-hidden="true" className="h-8 w-8" viewBox="0 0 24 24" fill="none">
                <path d="M8.5 12.5l7-4M8.5 11.5l7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="6.5" cy="12" r="2.5" fill="currentColor" />
                <circle cx="17.5" cy="7.5" r="2.5" fill="currentColor" />
                <circle cx="17.5" cy="16.5" r="2.5" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              className="hidden h-11 rounded-lg bg-[#bf80d8] px-6 text-sm font-bold text-[#4f415b] shadow-sm transition hover:bg-[#b673cf] focus:outline-none focus:ring-2 focus:ring-[#8e4da4] sm:inline-block"
            >
              Download
            </button>
            <button
              type="button"
              className="hidden h-11 rounded-lg bg-[#bf80d8] px-7 text-sm font-bold text-[#4f415b] shadow-sm transition hover:bg-[#b673cf] focus:outline-none focus:ring-2 focus:ring-[#8e4da4] sm:inline-block"
            >
              Save
            </button>
          </div>
        </header>

        <div className="relative z-0 grid min-h-0 flex-1 place-items-center overflow-hidden py-4">
          <div
            ref={boardRef}
            onDragOver={handleCanvasFileDragOver}
            onDragLeave={handleCanvasFileDragLeave}
            onDrop={handleCanvasFileDrop}
            onPointerDown={handleCanvasPanStart}
            onPointerMove={(event) => {
              handlePointerMove(event);
              handleCanvasPanMove(event);
            }}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            className={`relative aspect-[3/2] touch-none select-none overflow-hidden rounded-lg shadow-[0_24px_70px_rgba(137,103,145,0.22)] transition-[box-shadow,transform] duration-200 ease-in-out ${
              panState ? 'cursor-grabbing' : 'cursor-grab'
            } ${
              isDraggingFileOverCanvas
                ? 'shadow-[0_0_0_4px_rgba(155,47,114,0.45),0_24px_70px_rgba(137,103,145,0.22)]'
                : ''
            }`}
            style={{
              ...boardCanvasSize,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center',
            }}
          >
            <img
              src={selectedBoardImage}
              alt="Selected board canvas"
              className="h-full w-full object-contain"
              draggable={false}
            />

            {isDraggingFileOverCanvas && (
              <div className="pointer-events-none absolute inset-4 z-[60] grid place-items-center rounded-lg border-2 border-dashed border-[#9b2f72] bg-[#fff7fd]/55 text-xl font-bold text-[#9b2f72] shadow-[0_0_28px_rgba(155,47,114,0.28)]">
                Drop image here
              </div>
            )}

            {canvasImages.map((image) => {
              const drawerIndex = drawerImages.findIndex(
                (drawerImage) => drawerImage.id === image.id,
              );
              const zIndex =
                drawerIndex >= 0 ? drawerImages.length - drawerIndex : 1;

              return (
                <div
                  key={image.id}
                  data-canvas-item="true"
                  role="button"
                  tabIndex={0}
                  aria-label={`${image.name} on board`}
                  onClick={() => setSelectedImageId(image.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setSelectedImageId(image.id);
                    }
                  }}
                  onPointerDown={(event) => handlePointerDown(event, image)}
                  className={`absolute grid cursor-grab place-items-center text-sm font-bold text-[#594461] transition-[box-shadow,transform] duration-100 active:cursor-grabbing ${
                    image.imageUrl
                      ? 'rounded-md p-0'
                      : 'rounded-lg border border-white/70 p-2 shadow-lg'
                  } ${
                    selectedImageId === image.id
                      ? 'shadow-[0_0_0_5px_rgba(211,91,158,0.18),0_18px_32px_rgba(137,54,102,0.28)]'
                      : ''
                  } ${
                    dragState && dragState.id === image.id
                      ? 'scale-[1.04]'
                      : 'hover:scale-[1.03]'
                  }`}
                  style={{
                    left: `${image.x}%`,
                    top: `${image.y}%`,
                    width: `${image.width}%`,
                    height: `${image.height}%`,
                    backgroundColor: image.imageUrl
                      ? 'transparent'
                      : image.color,
                    zIndex,
                  }}
                >
                  {image.imageUrl ? (
                    <img
                      src={image.imageUrl}
                      alt={image.name}
                      className="block h-full w-full rounded-md object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center rounded-md border border-white/70 bg-white/45">
                      {image.name}
                    </span>
                  )}
                  {selectedImageId === image.id && (
                    <>
                      <span className="pointer-events-none absolute inset-0 z-10 rounded-md border-2 border-[#9b2f72]" />
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteImage(image.id);
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        aria-label={`Delete ${image.name}`}
                        className="absolute left-1/2 top-[calc(100%+0.5rem)] z-20 h-7 -translate-x-1/2 rounded-lg bg-white px-3 text-xs font-bold text-[#9b2f72] shadow-[0_6px_16px_rgba(155,47,114,0.2)] transition hover:bg-[#ffe8f5] focus:outline-none focus:ring-2 focus:ring-[#9b2f72]"
                      >
                        Delete
                      </button>
                      {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as ResizeDirection[]).map(
                        (direction) => (
                          <span
                            key={direction}
                            role="presentation"
                            onPointerDown={(event) =>
                              handleResizePointerDown(event, image, direction)
                            }
                            className={`absolute h-3 w-3 rounded-full border border-white bg-[#9b2f72] shadow-sm ${
                              direction === 'nw'
                                ? '-left-1.5 -top-1.5 cursor-nwse-resize'
                                : direction === 'n'
                                  ? 'left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize'
                                  : direction === 'ne'
                                    ? '-right-1.5 -top-1.5 cursor-nesw-resize'
                                    : direction === 'e'
                                      ? '-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize'
                                      : direction === 'se'
                                        ? '-bottom-1.5 -right-1.5 cursor-nwse-resize'
                                        : direction === 's'
                                          ? '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'
                                          : direction === 'sw'
                                            ? '-bottom-1.5 -left-1.5 cursor-nesw-resize'
                                            : '-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize'
                            }`}
                          />
                        ),
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="fixed bottom-5 right-5 z-20 flex items-center overflow-hidden rounded-lg bg-white shadow-[0_10px_28px_rgba(117,76,126,0.18)]">
          <button
            type="button"
            onClick={() => handleZoom('out')}
            aria-label="Zoom out"
            className={`grid h-10 w-11 place-items-center bg-white text-xl font-bold text-[#4f415b] transition hover:bg-[#fff7fd] focus:outline-none focus:ring-2 focus:ring-[#9b2f72] ${
              activeZoomControl === 'out'
                ? 'shadow-[0_0_18px_rgba(155,47,114,0.55)]'
                : ''
            }`}
          >
            -
          </button>
          <span className="grid h-10 min-w-16 place-items-center bg-white px-3 text-sm font-bold text-[#4f415b]">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => handleZoom('in')}
            aria-label="Zoom in"
            className={`grid h-10 w-11 place-items-center bg-white text-xl font-bold text-[#4f415b] transition hover:bg-[#fff7fd] focus:outline-none focus:ring-2 focus:ring-[#9b2f72] ${
              activeZoomControl === 'in'
                ? 'shadow-[0_0_18px_rgba(155,47,114,0.55)]'
                : ''
            }`}
          >
            +
          </button>
        </div>
      </section>
    </main>
  );
}

export default BoardViewPage;

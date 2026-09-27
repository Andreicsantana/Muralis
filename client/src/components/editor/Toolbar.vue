<template>
  <aside class="w-80 bg-asphalt-900 border-l-2 border-asphalt-700 flex flex-col h-full overflow-y-auto text-sm select-none">
    <!-- Header: Toolbox HUD -->
    <div class="p-4 border-b-2 border-asphalt-700 flex items-center justify-between bg-asphalt-950/60">
      <div>
        <span class="text-[10px] font-mono text-spray-pink font-bold uppercase tracking-widest block">
          // CONTROLES DE RUA
        </span>
        <h2 class="font-display font-black text-white text-base tracking-tight uppercase">Painel de Ajustes</h2>
      </div>

      <div class="flex items-center space-x-1.5">
        <button
          class="p-2 rounded-sm bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-700 text-slate-300 hover:text-white disabled:opacity-25 transition-all"
          :disabled="!canUndo"
          title="Desfazer (Ctrl+Z)"
          @click="$emit('undo')"
        >
          <UndoIcon class="w-3.5 h-3.5" />
        </button>
        <button
          class="p-2 rounded-sm bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-700 text-slate-300 hover:text-white disabled:opacity-25 transition-all"
          :disabled="!canRedo"
          title="Refazer"
          @click="$emit('redo')"
        >
          <RedoIcon class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div class="p-4 space-y-6 flex-1">
      <!-- Image Uploads -->
      <div class="space-y-3">
        <label class="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
          [1] Camadas do Mural
        </label>

        <!-- Wall Photo Upload -->
        <div>
          <span class="block text-xs font-mono text-slate-300 mb-1">Muro / Fachada Real</span>
          <div class="flex items-center space-x-2">
            <input
              ref="baseFileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleBasePhotoUpload"
            />
            <button
              class="flex-1 py-2 px-3 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono font-bold text-white flex items-center justify-center space-x-1.5 transition-all active:scale-95"
              @click="baseFileInputRef?.click()"
            >
              <UploadIcon class="w-3.5 h-3.5 text-spray-pink" />
              <span>Carregar Foto</span>
            </button>
            <button
              class="py-2 px-2.5 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono text-slate-300 transition-colors"
              title="Carregar Muro de Tijolos de Teste"
              @click="loadSampleBase"
            >
              Exemplo
            </button>
          </div>

          <!-- Live Camera Button -->
          <div class="mt-2 flex items-center space-x-2">
            <button
              class="flex-1 py-2 px-3 border rounded-sm text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-md"
              :class="isCameraActive ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 text-white animate-pulse' : 'bg-spray-pink hover:bg-spray-pinkHover border-spray-pink text-white shadow-spray-pink'"
              @click="$emit('toggleCamera')"
              :title="isCameraActive ? 'Desativar Câmera em Tempo Real' : 'Apontar a câmera para o muro em tempo real (RA)'"
            >
              <CameraIcon class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{{ isCameraActive ? 'Desativar Câmera' : 'Câmera ao Vivo / RA' }}</span>
            </button>
            <button
              v-if="isCameraActive"
              class="py-2 px-3 bg-spray-volt hover:bg-spray-voltHover border border-spray-volt rounded-sm text-xs font-mono font-bold text-asphalt-950 flex items-center justify-center space-x-1 transition-all shadow-spray-volt"
              title="Congelar e Capturar Foto do Muro"
              @click="$emit('captureCamera')"
            >
              <CheckIcon class="w-3.5 h-3.5 stroke-[3]" />
              <span>Capturar</span>
            </button>
          </div>
        </div>

        <!-- Artwork Upload -->
        <div>
          <span class="block text-xs font-mono text-slate-300 mb-1">Arte / Pixo / Ilustração</span>
          <div class="flex items-center space-x-2">
            <input
              ref="artFileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleArtUpload"
            />
            <button
              class="flex-1 py-2 px-3 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono font-bold text-white flex items-center justify-center space-x-1.5 transition-all active:scale-95"
              @click="artFileInputRef?.click()"
            >
              <UploadIcon class="w-3.5 h-3.5 text-spray-volt" />
              <span>Carregar Arte</span>
            </button>
            <button
              class="py-2 px-2.5 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-600 rounded-sm text-xs font-mono text-slate-300 transition-colors"
              title="Carregar Arte Urbana de Exemplo"
              @click="loadSampleArt"
            >
              Exemplo
            </button>
          </div>
        </div>
      </div>

      <!-- Perspective & Alignment -->
      <div class="space-y-3 pt-3 border-t border-asphalt-800">
        <label class="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
          [2] Perspectiva & Encaixe
        </label>

        <button
          class="w-full py-2.5 px-3 bg-gradient-to-r from-spray-purple via-spray-pink to-spray-yellow text-white rounded-sm text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-spray-pink transition-all hover:scale-[1.02] active:scale-[0.98]"
          @click="$emit('autoFit')"
          title="Detectar perspectiva diagonal e encaixar no muro"
        >
          <Wand2Icon class="w-4 h-4 text-white" />
          <span>Auto-Ajustar ao Muro (IA)</span>
        </button>

        <!-- Quick Direction Presets -->
        <div class="space-y-1">
          <span class="text-[11px] font-mono text-slate-400 uppercase">Direção do Muro:</span>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              class="py-1.5 px-2 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-700 hover:border-spray-pink text-slate-200 rounded-sm text-xs font-mono font-semibold text-center transition-all"
              title="Muro fugindo para a esquerda"
              @click="$emit('applyPreset', -0.32)"
            >
              <span>◀ Esq.</span>
            </button>
            <button
              class="py-1.5 px-2 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-700 hover:border-spray-volt text-slate-200 rounded-sm text-xs font-mono font-semibold text-center transition-all"
              title="Muro visto de frente"
              @click="$emit('applyPreset', 0)"
            >
              <span>Frontal</span>
            </button>
            <button
              class="py-1.5 px-2 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-700 hover:border-spray-yellow text-slate-200 rounded-sm text-xs font-mono font-semibold text-center transition-all"
              title="Muro fugindo para a direita"
              @click="$emit('applyPreset', 0.32)"
            >
              <span>Dir. ▶</span>
            </button>
          </div>
        </div>

        <!-- Scale & Position Sliders -->
        <div class="space-y-2.5 pt-1">
          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-slate-300">
              <span>Escala da Arte</span>
              <span class="text-spray-volt font-bold">{{ Math.round(artScale * 100) }}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.95"
              step="0.05"
              :value="artScale"
              class="w-full h-1.5 bg-asphalt-800 rounded-sm appearance-none cursor-pointer"
              @input="(e) => $emit('update:artScale', parseFloat((e.target as HTMLInputElement).value))"
            />
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-slate-300">
              <span>Posição no Muro</span>
              <span class="text-spray-pink font-bold">{{ verticalPositionLabel }}</span>
            </div>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.05"
              :value="verticalPosition"
              class="w-full h-1.5 bg-asphalt-800 rounded-sm appearance-none cursor-pointer"
              @input="(e) => $emit('update:verticalPosition', parseFloat((e.target as HTMLInputElement).value))"
            />
          </div>
        </div>
      </div>

      <!-- Blend Modes (Spray Can Caps) -->
      <div class="space-y-3 pt-3 border-t border-asphalt-800">
        <label class="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
          [3] Textura & Tinta Spray (Blend)
        </label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="mode in blendModes"
            :key="mode.id"
            class="py-2 px-2 text-xs font-mono rounded-sm font-bold border text-center transition-all"
            :class="
              blendMode === mode.id
                ? 'bg-spray-pink border-spray-pink text-white shadow-spray-pink'
                : 'bg-asphalt-800 border-asphalt-700 text-slate-300 hover:bg-asphalt-700 hover:text-white'
            "
            @click="$emit('update:blendMode', mode.id)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <!-- Visual Adjustments -->
      <div class="space-y-3.5 pt-3 border-t border-asphalt-800">
        <label class="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
          [4] Ajustes Visuais
        </label>

        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono text-slate-300">
            <span>Opacidade</span>
            <span class="text-spray-volt font-bold">{{ Math.round(opacity * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="opacity"
            class="w-full h-1.5 bg-asphalt-800 rounded-sm appearance-none cursor-pointer"
            @input="(e) => $emit('update:opacity', parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono text-slate-300">
            <span>Brilho do Spray</span>
            <span class="text-spray-yellow font-bold">{{ Math.round((brightness - 1) * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.01"
            :value="brightness"
            class="w-full h-1.5 bg-asphalt-800 rounded-sm appearance-none cursor-pointer"
            @input="(e) => $emit('update:brightness', parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono text-slate-300">
            <span>Contraste da Tinta</span>
            <span class="text-spray-pink font-bold">{{ Math.round((contrast - 1) * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.01"
            :value="contrast"
            class="w-full h-1.5 bg-asphalt-800 rounded-sm appearance-none cursor-pointer"
            @input="(e) => $emit('update:contrast', parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>
      </div>

      <!-- Occlusion Mask Brush -->
      <div class="space-y-3 pt-3 border-t border-asphalt-800">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            [5] Stencil / Oclusão
          </label>
          <button
            class="py-1 px-2.5 text-xs font-mono font-bold rounded-sm border transition-all"
            :class="
              isMaskMode
                ? 'bg-spray-yellow border-spray-yellow text-asphalt-950 shadow-spray-yellow'
                : 'bg-asphalt-800 border-asphalt-700 text-slate-300 hover:bg-asphalt-700 hover:text-white'
            "
            @click="$emit('toggleMaskMode')"
          >
            {{ isMaskMode ? 'Sair do Pincel' : 'Pintar Oclusão' }}
          </button>
        </div>

        <div v-if="isMaskMode" class="space-y-3 bg-asphalt-950 p-3 rounded-sm border-2 border-asphalt-700">
          <p class="text-[11px] font-mono text-slate-400 leading-relaxed">
            Pinte postes, fios ou árvores na frente do muro para que a arte fique atrás deles.
          </p>

          <div class="flex items-center space-x-2">
            <button
              class="flex-1 py-1.5 text-xs font-mono font-bold rounded-sm border text-center transition-all"
              :class="
                !isEraser
                  ? 'bg-spray-pink border-spray-pink text-white shadow-spray-pink'
                  : 'bg-asphalt-800 border-asphalt-700 text-slate-400'
              "
              @click="$emit('update:isEraser', false)"
            >
              Pincel
            </button>
            <button
              class="flex-1 py-1.5 text-xs font-mono font-bold rounded-sm border text-center transition-all"
              :class="
                isEraser
                  ? 'bg-spray-volt border-spray-volt text-asphalt-950 shadow-spray-volt'
                  : 'bg-asphalt-800 border-asphalt-700 text-slate-400'
              "
              @click="$emit('update:isEraser', true)"
            >
              Borracha
            </button>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-slate-300">
              <span>Espessura</span>
              <span class="text-spray-yellow font-bold">{{ brushSize }}px</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              :value="brushSize"
              class="w-full h-1.5 bg-asphalt-800 rounded-sm appearance-none cursor-pointer"
              @input="(e) => $emit('update:brushSize', parseInt((e.target as HTMLInputElement).value))"
            />
          </div>

          <button
            class="w-full py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 rounded-sm text-xs font-mono font-bold transition-colors"
            @click="$emit('clearMask')"
          >
            Limpar Toda a Máscara
          </button>
        </div>
      </div>
    </div>

    <!-- Sticky Bottom Action Footer -->
    <div class="p-4 border-t-2 border-asphalt-700 space-y-2 bg-asphalt-950/80">
      <button
        class="w-full py-2.5 bg-spray-pink hover:bg-spray-pinkHover text-white rounded-sm font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-spray-pink active:scale-98"
        @click="$emit('save')"
      >
        <SaveIcon class="w-4 h-4 stroke-[2.5]" />
        <span>Salvar no Estúdio</span>
      </button>

      <div class="flex space-x-2">
        <button
          class="flex-1 py-2 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-600 text-slate-200 rounded-sm font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
          @click="$emit('share')"
        >
          <Share2Icon class="w-3.5 h-3.5 text-spray-volt" />
          <span>Compartilhar</span>
        </button>
        <button
          class="flex-1 py-2 bg-asphalt-800 hover:bg-asphalt-700 border border-asphalt-600 text-slate-200 rounded-sm font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
          @click="$emit('export')"
        >
          <DownloadIcon class="w-3.5 h-3.5 text-spray-yellow" />
          <span>Exportar HD</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { BlendMode } from '../../engine/blendEngine.js';
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Share2 as Share2Icon,
  Camera as CameraIcon,
  Check as CheckIcon,
  Wand2 as Wand2Icon
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    blendMode: BlendMode;
    opacity: number;
    brightness: number;
    contrast: number;
    canUndo: boolean;
    canRedo: boolean;
    isMaskMode: boolean;
    brushSize: number;
    isEraser: boolean;
    isCameraActive?: boolean;
    artScale?: number;
    verticalPosition?: number;
  }>(),
  {
    artScale: 0.70,
    verticalPosition: 0
  }
);

const emit = defineEmits<{
  (e: 'update:blendMode', val: BlendMode): void;
  (e: 'update:opacity', val: number): void;
  (e: 'update:brightness', val: number): void;
  (e: 'update:contrast', val: number): void;
  (e: 'update:brushSize', val: number): void;
  (e: 'update:isEraser', val: boolean): void;
  (e: 'update:artScale', val: number): void;
  (e: 'update:verticalPosition', val: number): void;
  (e: 'applyPreset', slope: number): void;
  (e: 'toggleMaskMode'): void;
  (e: 'clearMask'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'save'): void;
  (e: 'share'): void;
  (e: 'export'): void;
  (e: 'baseLoaded', url: string): void;
  (e: 'artLoaded', url: string): void;
  (e: 'toggleCamera'): void;
  (e: 'captureCamera'): void;
  (e: 'autoFit'): void;
}>();

const verticalPositionLabel = computed(() => {
  const pos = props.verticalPosition ?? 0;
  if (pos < -0.2) return 'Topo';
  if (pos > 0.2) return 'Rodapé';
  return 'Centro';
});

const baseFileInputRef = ref<HTMLInputElement | null>(null);
const artFileInputRef = ref<HTMLInputElement | null>(null);

const blendModes: { id: BlendMode; label: string }[] = [
  { id: 'multiply', label: 'Tinta no Muro (Multiplicação)' },
  { id: 'overlay', label: 'Spray Intenso (Sobrepor)' },
  { id: 'soft-light', label: 'Luz Suave (Natural)' },
  { id: 'normal', label: 'Adesivo / Opaco (Normal)' }
];

function handleBasePhotoUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  emit('baseLoaded', url);
}

function handleArtUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  emit('artLoaded', url);
}

function loadSampleBase() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e212b';
  ctx.fillRect(0, 0, 1200, 800);

  ctx.strokeStyle = '#12141a';
  ctx.lineWidth = 4;
  const brickH = 40;
  const brickW = 100;

  for (let y = 0; y < 800; y += brickH) {
    const isOdd = (y / brickH) % 2 === 1;
    const offset = isOdd ? brickW / 2 : 0;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1200, y);
    ctx.stroke();

    for (let x = -offset; x < 1200; x += brickW) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + brickH);
      ctx.stroke();
    }
  }

  const noise = ctx.getImageData(0, 0, 1200, 800);
  for (let i = 0; i < noise.data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 45;
    noise.data[i] += grain;
    noise.data[i + 1] += grain;
    noise.data[i + 2] += grain;
  }
  ctx.putImageData(noise, 0, 0);

  emit('baseLoaded', canvas.toDataURL());
}

function loadSampleArt() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, '#ff0055');
  gradient.addColorStop(0.5, '#8a2be2');
  gradient.addColorStop(1, '#00ff88');

  ctx.fillStyle = gradient;
  ctx.fillRect(40, 40, 720, 520);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 90px "Permanent Marker", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MURALIS', 400, 260);

  ctx.font = '32px "Space Grotesk", sans-serif';
  ctx.fillText('GRAFFITI STUDIO // STREET', 400, 350);

  emit('artLoaded', canvas.toDataURL('image/png'));
}
</script>

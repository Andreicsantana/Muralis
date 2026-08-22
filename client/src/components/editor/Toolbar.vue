<template>
  <aside class="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto text-sm">
    <div class="p-4 border-b border-slate-800 flex items-center justify-between">
      <h2 class="font-semibold text-slate-200">Painel de Ajustes</h2>
      <div class="flex items-center space-x-1">
        <button
          class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
          :disabled="!canUndo"
          title="Desfazer"
          @click="$emit('undo')"
        >
          <UndoIcon class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30"
          :disabled="!canRedo"
          title="Refazer"
          @click="$emit('redo')"
        >
          <RedoIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="p-4 space-y-6 flex-1">
      <div class="space-y-3">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Imagens do Projeto</label>

        <div>
          <label class="block text-xs text-slate-300 mb-1">Foto da Fachada / Muro</label>
          <div class="flex items-center space-x-2">
            <input
              ref="baseFileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleBasePhotoUpload"
            />
            <button
              class="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
              @click="baseFileInputRef?.click()"
            >
              <UploadIcon class="w-3.5 h-3.5" />
              <span>Carregar Fachada</span>
            </button>
            <button
              class="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-slate-300"
              title="Usar Muro de Exemplo"
              @click="loadSampleBase"
            >
              Exemplo
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs text-slate-300 mb-1">Arte / Ilustração / Tipografia</label>
          <div class="flex items-center space-x-2">
            <input
              ref="artFileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleArtUpload"
            />
            <button
              class="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
              @click="artFileInputRef?.click()"
            >
              <UploadIcon class="w-3.5 h-3.5" />
              <span>Carregar Arte</span>
            </button>
            <button
              class="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-slate-300"
              title="Usar Arte de Exemplo"
              @click="loadSampleArt"
            >
              Exemplo
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Modo de Mesclagem (Blend)</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="mode in blendModes"
            :key="mode.id"
            class="py-2 px-2 text-xs rounded font-medium border text-center transition-colors"
            :class="
              blendMode === mode.id
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            "
            @click="$emit('update:blendMode', mode.id)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Iluminação e Opacidade</label>

        <div>
          <div class="flex justify-between text-xs text-slate-300 mb-1">
            <span>Opacidade</span>
            <span>{{ Math.round(opacity * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="opacity"
            class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            @input="(e) => $emit('update:opacity', parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>

        <div>
          <div class="flex justify-between text-xs text-slate-300 mb-1">
            <span>Brilho</span>
            <span>{{ Math.round((brightness - 1) * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.02"
            :value="brightness"
            class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            @input="(e) => $emit('update:brightness', parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>

        <div>
          <div class="flex justify-between text-xs text-slate-300 mb-1">
            <span>Contraste</span>
            <span>{{ Math.round((contrast - 1) * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.02"
            :value="contrast"
            class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            @input="(e) => $emit('update:contrast', parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Máscara de Recorte</label>
          <button
            class="text-xs text-brand-400 hover:text-brand-300 underline"
            @click="$emit('toggleMaskMode')"
          >
            {{ isMaskMode ? 'Finalizar Recorte' : 'Recortar Obstáculos' }}
          </button>
        </div>

        <div v-if="isMaskMode" class="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-3">
          <div class="flex justify-between text-xs text-slate-300">
            <span>Tamanho do Pincel</span>
            <span>{{ brushSize }}px</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="1"
            :value="brushSize"
            class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            @input="(e) => $emit('update:brushSize', parseInt((e.target as HTMLInputElement).value))"
          />
          <div class="flex space-x-2 pt-1">
            <button
              class="flex-1 py-1 px-2 rounded text-xs border"
              :class="isEraser ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-brand-600 border-brand-500 text-white'"
              @click="$emit('update:isEraser', false)"
            >
              Furar
            </button>
            <button
              class="flex-1 py-1 px-2 rounded text-xs border"
              :class="isEraser ? 'bg-brand-600 border-brand-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'"
              @click="$emit('update:isEraser', true)"
            >
              Apagar Furo
            </button>
            <button
              class="py-1 px-2 rounded text-xs bg-red-900/40 border border-red-800 text-red-300 hover:bg-red-900/60"
              @click="$emit('clearMask')"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="p-4 border-t border-slate-800 space-y-2">
      <button
        class="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.98]"
        @click="$emit('export')"
      >
        <DownloadIcon class="w-4 h-4" />
        <span>Exportar em Alta Resolução</span>
      </button>

      <div class="flex space-x-2">
        <button
          class="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-slate-300 flex items-center justify-center space-x-1.5"
          @click="$emit('save')"
        >
          <SaveIcon class="w-3.5 h-3.5" />
          <span>Salvar</span>
        </button>
        <button
          class="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-slate-300 flex items-center justify-center space-x-1.5"
          @click="$emit('share')"
        >
          <Share2Icon class="w-3.5 h-3.5" />
          <span>Compartilhar</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BlendMode } from '../../engine/blendEngine.js';
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Share2 as Share2Icon
} from 'lucide-vue-next';

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
}>();

const emit = defineEmits<{
  (e: 'update:blendMode', val: BlendMode): void;
  (e: 'update:opacity', val: number): void;
  (e: 'update:brightness', val: number): void;
  (e: 'update:contrast', val: number): void;
  (e: 'update:brushSize', val: number): void;
  (e: 'update:isEraser', val: boolean): void;
  (e: 'toggleMaskMode'): void;
  (e: 'clearMask'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'save'): void;
  (e: 'share'): void;
  (e: 'export'): void;
  (e: 'baseLoaded', url: string): void;
  (e: 'artLoaded', url: string): void;
}>();

const baseFileInputRef = ref<HTMLInputElement | null>(null);
const artFileInputRef = ref<HTMLInputElement | null>(null);

const blendModes: { id: BlendMode; label: string }[] = [
  { id: 'multiply', label: 'Multiplicação (Textura)' },
  { id: 'overlay', label: 'Sobrepor (Cores Vivas)' },
  { id: 'soft-light', label: 'Luz Suave (Natural)' },
  { id: 'normal', label: 'Normal (Opaco)' }
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

  ctx.fillStyle = '#b35d38';
  ctx.fillRect(0, 0, 1200, 800);

  ctx.strokeStyle = '#8a4224';
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
  gradient.addColorStop(0, '#ec4899');
  gradient.addColorStop(0.5, '#8b5cf6');
  gradient.addColorStop(1, '#06b6d4');

  ctx.fillStyle = gradient;
  ctx.fillRect(40, 40, 720, 520);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 90px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MURALIS', 400, 260);

  ctx.font = '32px sans-serif';
  ctx.fillText('URBAN ART SIMULATOR', 400, 350);

  emit('artLoaded', canvas.toDataURL('image/png'));
}
</script>

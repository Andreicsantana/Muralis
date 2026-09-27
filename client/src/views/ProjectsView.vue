<template>
  <div class="h-full bg-asphalt-950 flex flex-col overflow-y-auto">
    <!-- Street Header -->
    <header class="h-16 bg-asphalt-900 border-b-2 border-asphalt-700 flex items-center justify-between px-6 lg:px-10 z-10">
      <div class="flex items-center space-x-3">
        <div class="px-2.5 py-1 bg-spray-pink text-white font-tag text-lg tracking-wider rounded-sm shadow-spray-pink transform -rotate-1">
          M
        </div>
        <div>
          <h1 class="font-display font-black text-lg text-white tracking-tight uppercase">MURALIS</h1>
          <span class="text-[10px] text-spray-volt font-mono font-bold tracking-widest uppercase block -mt-1">
            // STREET LAB
          </span>
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <button
          class="py-2 px-4 bg-spray-volt hover:bg-spray-voltHover text-asphalt-950 text-xs font-black uppercase tracking-wider rounded-sm flex items-center space-x-2 transition-all shadow-spray-volt active:scale-95"
          @click="createNewProject"
        >
          <PlusIcon class="w-4 h-4 stroke-[3]" />
          <span>Novo Muro / Projeto</span>
        </button>

        <button
          v-if="authStore.isAuthenticated"
          class="text-xs font-mono text-slate-400 hover:text-spray-pink transition-colors uppercase tracking-wider"
          @click="authStore.clearAuth(); $router.push('/login')"
        >
          [ Sair ]
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl w-full mx-auto p-6 lg:p-10 space-y-8 flex-1">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-asphalt-800 pb-6">
        <div>
          <span class="text-xs font-mono font-bold uppercase tracking-widest text-spray-pink">
            GALERIA DE SIMULAÇÕES
          </span>
          <h2 class="text-2xl lg:text-3xl font-display font-black text-white tracking-tight uppercase mt-1">
            Muros & Fachadas
          </h2>
          <p class="text-xs font-mono text-slate-400 mt-1">
            Gerencie seus murais, alinhamentos de perspectiva e oclusões de rua.
          </p>
        </div>

        <div class="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-asphalt-900 border border-asphalt-800 px-3 py-1.5 rounded-sm self-start md:self-auto">
          <span class="w-2 h-2 rounded-full bg-spray-volt animate-pulse"></span>
          <span>{{ projects.length }} Mural(is) Registrado(s)</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20 text-slate-400 font-mono text-xs animate-pulse">
        [ CARREGANDO GALERIA DE MUROS... ]
      </div>

      <!-- Empty State -->
      <div v-else-if="projects.length === 0" class="border-2 border-dashed border-asphalt-700 bg-asphalt-900/40 p-12 text-center space-y-4 rounded-sm">
        <div class="w-16 h-16 bg-asphalt-800 border border-asphalt-700 mx-auto flex items-center justify-center text-spray-pink shadow-spray-pink transform rotate-3">
          <FolderPlusIcon class="w-8 h-8" />
        </div>
        <h3 class="text-base font-display font-black text-white uppercase tracking-wide">
          Nenhum mural simulado ainda
        </h3>
        <p class="text-xs font-mono text-slate-400 max-w-md mx-auto leading-relaxed">
          Suba a foto de uma fachada ou aponte a câmera ao vivo para projetar suas ilustrações, pixações e murais com cálculo real de perspectiva.
        </p>
        <button
          class="py-2.5 px-5 bg-spray-pink hover:bg-spray-pinkHover text-white text-xs font-black uppercase tracking-wider rounded-sm inline-flex items-center space-x-2 shadow-spray-pink transition-all active:scale-95"
          @click="createNewProject"
        >
          <PlusIcon class="w-4 h-4 stroke-[3]" />
          <span>Iniciar Primeira Simulação</span>
        </button>
      </div>

      <!-- Project Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="proj in projects"
          :key="proj.id"
          class="bg-asphalt-900 border-2 border-asphalt-700 hover:border-spray-pink transition-all flex flex-col group cursor-pointer shadow-lg hover:shadow-spray-pink relative"
          @click="$router.push(`/editor/${proj.id}`)"
        >
          <!-- Preview Box with Street Wall Placeholder -->
          <div class="h-48 bg-asphalt-950 flex items-center justify-center relative overflow-hidden border-b border-asphalt-800">
            <!-- Street Tag Badge -->
            <div class="absolute top-3 left-3 px-2 py-0.5 bg-asphalt-900/90 border border-asphalt-700 text-[10px] font-mono text-spray-volt font-semibold tracking-wider uppercase z-10">
              {{ proj.blendMode.toUpperCase() }}
            </div>

            <!-- Visual Texture -->
            <div class="w-full h-full flex items-center justify-center bg-gradient-to-b from-asphalt-900/30 to-asphalt-950 group-hover:scale-105 transition-transform duration-300">
              <span class="font-tag text-slate-700 group-hover:text-spray-pink/40 transition-colors text-2xl tracking-widest uppercase">
                MURAL
              </span>
            </div>
          </div>

          <!-- Info Footer -->
          <div class="p-4 flex items-center justify-between">
            <div class="min-w-0 flex-1 pr-2">
              <h4 class="text-sm font-display font-bold text-white group-hover:text-spray-pink transition-colors truncate uppercase">
                {{ proj.title || 'Mural Sem Título' }}
              </h4>
              <span class="text-[11px] font-mono text-slate-500 block mt-0.5">
                Atualizado: {{ new Date(proj.updatedAt).toLocaleDateString('pt-BR') }}
              </span>
            </div>

            <button
              class="p-2 rounded-sm hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors border border-transparent hover:border-rose-700/50"
              title="Excluir Mural"
              @click.stop="deleteProject(proj.id)"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus as PlusIcon, FolderPlus as FolderPlusIcon, Trash2 as Trash2Icon } from 'lucide-vue-next';
import { useAuthStore } from '../stores/authStore.js';
import { useProjectStore } from '../stores/projectStore.js';
import { apiRequest } from '../services/apiClient.js';

const router = useRouter();
const authStore = useAuthStore();
const projectStore = useProjectStore();

const projects = ref<any[]>([]);
const loading = ref(true);

async function loadProjects() {
  loading.value = true;
  try {
    const data = await apiRequest('/projects');
    projects.value = data;
  } catch (err) {
    console.error('Failed to load projects', err);
  } finally {
    loading.value = false;
  }
}

async function createNewProject() {
  projectStore.resetProject();
  router.push('/editor');
}

async function deleteProject(id: string) {
  if (!confirm('Tem certeza que deseja apagar esta simulação de mural?')) return;

  try {
    await apiRequest(`/projects/${id}`, { method: 'DELETE' });
    projects.value = projects.value.filter(p => p.id !== id);
  } catch (err) {
    console.error('Failed to delete project', err);
  }
}

onMounted(() => {
  loadProjects();
});
</script>

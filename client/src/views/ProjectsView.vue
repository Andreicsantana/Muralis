<template>
  <div class="h-full bg-slate-950 flex flex-col overflow-y-auto">
    <header class="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded bg-brand-600 flex items-center justify-center font-bold text-white tracking-wider text-sm">
          M
        </div>
        <h1 class="text-base font-bold text-white">Muralis</h1>
      </div>

      <div class="flex items-center space-x-4">
        <button
          class="py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-semibold flex items-center space-x-2 transition-all shadow-md active:scale-95"
          @click="createNewProject"
        >
          <PlusIcon class="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>

        <button
          v-if="authStore.isAuthenticated"
          class="text-xs text-slate-400 hover:text-white"
          @click="authStore.clearAuth(); $router.push('/login')"
        >
          Sair
        </button>
      </div>
    </header>

    <main class="max-w-6xl w-full mx-auto p-8 space-y-6 flex-1">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white">Meus Projetos</h2>
          <p class="text-xs text-slate-400 mt-1">Gerencie suas simulações de murais e fachadas</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-slate-500 text-sm">
        Carregando projetos...
      </div>

      <div v-else-if="projects.length === 0" class="border border-dashed border-slate-800 rounded-xl p-12 text-center space-y-3">
        <div class="w-12 h-12 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-500">
          <FolderPlusIcon class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-semibold text-slate-300">Nenhum projeto ainda</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          Crie seu primeiro projeto para simular a aplicação de ilustrações ou grafites sobre fachadas reais.
        </p>
        <button
          class="py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-semibold inline-flex items-center space-x-2"
          @click="createNewProject"
        >
          <PlusIcon class="w-3.5 h-3.5" />
          <span>Criar Simulação</span>
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="proj in projects"
          :key="proj.id"
          class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg overflow-hidden flex flex-col group cursor-pointer transition-all hover:shadow-xl"
          @click="$router.push(`/editor/${proj.id}`)"
        >
          <div class="h-44 bg-slate-950 flex items-center justify-center relative overflow-hidden">
            <span class="text-xs text-slate-600">Pré-visualização</span>
          </div>

          <div class="p-4 flex items-center justify-between border-t border-slate-800/80">
            <div>
              <h4 class="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">
                {{ proj.title }}
              </h4>
              <span class="text-[11px] text-slate-500">
                {{ new Date(proj.updatedAt).toLocaleDateString('pt-BR') }}
              </span>
            </div>

            <button
              class="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
              title="Excluir"
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

async function fetchProjects() {
  loading.value = true;
  try {
    projects.value = await apiRequest('/projects');
  } catch {
    projects.value = [];
  } finally {
    loading.value = false;
  }
}

function createNewProject() {
  projectStore.resetProject();
  router.push('/editor');
}

async function deleteProject(id: string) {
  if (!confirm('Deseja excluir este projeto?')) return;
  try {
    await apiRequest(`/projects/${id}`, { method: 'DELETE' });
    projects.value = projects.value.filter((p) => p.id !== id);
  } catch (err) {
    console.error(err);
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    fetchProjects();
  } else {
    loading.value = false;
  }
});
</script>

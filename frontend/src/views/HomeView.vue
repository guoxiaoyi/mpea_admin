<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const levelTabs = ['一级', '二级', '三级']
const activeLevel = ref('一级')

const levelToTeachers = {
  一级: ['讲师 A1', '讲师 A2', '讲师 A3', '讲师 A4', '讲师 A5'],
  二级: ['讲师 B1', '讲师 B2', '讲师 B3', '讲师 B4', '讲师 B5'],
  三级: ['讲师 C1', '讲师 C2', '讲师 C3', '讲师 C4', '讲师 C5'],
}

function setActive(level) {
  activeLevel.value = level
}

// Language toggle
const lang = ref('zh') // 'zh' | 'en'
const anchors = ['#home', '#about', '#features', '#kindergartens', '#cert', '#join']
const navLabels = {
  zh: ['首页', '简介', '业务与优势', '推荐幼儿园', '认证与合作', '加入MPEA'],
  en: ['Home', 'About', 'Services & Advantages', 'Recommended Kindergartens', 'Certification & Partners', 'Join MPEA'],
}
const heroTitle = {
  zh: 'MPEA蒙台梭利家长教育协会',
  en: 'MPEA Montessori Parents Education Association',
}
const heroSubtitle = {
  zh: '——以科学之名，守护童年的光',
  en: 'In the name of science, guarding the light of childhood',
}
function toggleLang() {
  lang.value = lang.value === 'zh' ? 'en' : 'zh'
}

const kindergartens = ref([])
const kindergartenLoading = ref(false)
const apiBase = (import.meta.env.VITE_API_BASE || window.location.origin).replace(/\/$/, '')

function resolveImage(url) {
  if (!url) return ''
  try {
    return new URL(url, `${apiBase}/`).href
  } catch (e) {
    return url
  }
}

async function loadKindergartens() {
  kindergartenLoading.value = true
  try {
    const res = await request.get('/api/public/kindergartens', { params: { limit: 6 } })
    if (res.success) {
      kindergartens.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (e) {
    kindergartens.value = []
  } finally {
    kindergartenLoading.value = false
  }
}

onMounted(() => {
  loadKindergartens()
})
</script>

<template>
  <main class="min-h-screen bg-white text-slate-800">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/src/assets/logo.svg" alt="MPEA" class="h-10 w-10" />
          <span class="font-semibold text-lg">MPEA</span>
        </div>
        <nav class="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a
            v-for="(href,i) in anchors"
            :key="href"
            :href="href"
            class="hover:text-indigo-600">
            {{ navLabels[lang][i] }}
          </a>
        </nav>
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="toggleLang"
            class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:border-slate-300 hover:bg-white/70">
            <span class="i18n-icon">🌐</span>
            <span>{{ lang === 'zh' ? 'EN' : '中文' }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section id="home" class="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-blue-50 to-white">
      <!-- Decorative gradient blobs -->
      <div class="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl"></div>
      <div class="pointer-events-none absolute top-20 right-0 h-64 w-64 translate-x-1/3 rounded-full bg-sky-200/40 blur-3xl"></div>
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div class="grid lg:grid-cols-2 items-center gap-10">
          <div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">{{ heroTitle[lang] }}</h1>
            <p class="mt-4 text-lg sm:text-xl text-slate-700">{{ heroSubtitle[lang] }}</p>
            <p class="mt-6 max-w-2xl text-slate-600 leading-7">
              为家庭提供科学的蒙台梭利教育支持体系，让父母成为孩子生命中的观察者、引导者与同行者。
            </p>
          </div>
          <div class="relative">
            <div class="aspect-[4/3] w-full rounded-2xl bg-gradient-to-br from-indigo-200 to-indigo-100 ring-1 ring-inset ring-indigo-100 shadow-xl shadow-indigo-100">
              <div class="h-full w-full flex items-center justify-center text-indigo-600 font-medium">Hero Image</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission & Vision -->
    <section id="mission" class="py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-5 gap-10 lg:gap-16">
          <div class="lg:col-span-2">
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">使命、愿景</h2>
            <div class="mt-6 rounded-xl bg-slate-50 p-6 ring-1 ring-inset ring-slate-200">
              <h3 class="font-semibold text-slate-900">使命：</h3>
              <p class="mt-2 text-slate-700 leading-7">
                为家庭提供科学的蒙台梭利教育支持体系，让父母成为孩子生命中真正的观察者、引导者与同行者。
              </p>
            </div>
          </div>
          <div class="lg:col-span-3">
            <h3 class="sr-only">愿景</h3>
            <ul class="space-y-3 text-slate-700 leading-7">
              <li class="flex gap-3"><span class="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></span><span>成为全球华人家庭蒙台梭利教育实践的首选智库</span></li>
              <li class="flex gap-3"><span class="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></span><span>推动"家庭-学校-社区"三位一体的蒙台梭利生态圈</span></li>
              <li class="flex gap-3"><span class="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></span><span>重塑一代中国家长的儿童观：从"教育焦虑者"到"成长观察者"</span></li>
              <li class="flex gap-3"><span class="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></span><span>培育100万蒙氏家庭，让每个孩子都能遵循内在节律自然绽放</span></li>
              <li class="flex gap-3"><span class="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500"></span><span>培养10万名专业蒙氏教育者，推动行业发展</span></li>
              <li class="ml-5 text-slate-600">- 培训家长、教师、育儿顾问，让更多人掌握蒙氏教育</li>
              <li class="ml-5 text-slate-600">- 让蒙台梭利教育在中国真正落地生根</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- About -->
    <section id="about" class="py-16 sm:py-24 bg-slate-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl">
          <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">MPEA简介</h2>
          <p class="mt-6 text-slate-700 leading-8">
            MPEA（Montessori Parents Education Association）是全球首个由华人家长发起、以家庭实践为核心的蒙台梭利教育推广组织。我们扎根中国本土，联结国际视野，致力于为家庭提供科学的蒙台梭利教育支持体系，让父母成为孩子生命中真正的观察者、引导者与同行者。
          </p>
          <p class="mt-4 text-slate-700 leading-8">
            自2016年创始于美国肯塔基州的中国学者家庭社群，MPEA历经多年沉淀，跨越三大洲实践验证，凝聚全球8000+家庭的智慧结晶，于2024年正式更名为中国本土协会——蒙台梭利家长教育协会。我们相信：<span class="font-semibold text-slate-900">每个家庭都能成为孩子最好的“有准备的环境”</span>。
          </p>
        </div>

        <!-- Photos 3-5 items -->
        <div class="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div class="aspect-[4/3] rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
            <img class="h-full w-full object-cover" src="https://picsum.photos/seed/mpea1/800/600" alt="MPEA photo 1" />
          </div>
          <div class="aspect-[4/3] rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
            <img class="h-full w-full object-cover" src="https://picsum.photos/seed/mpea2/800/600" alt="MPEA photo 2" />
          </div>
          <div class="aspect-[4/3] rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
            <img class="h-full w-full object-cover" src="https://picsum.photos/seed/mpea3/800/600" alt="MPEA photo 3" />
          </div>
          <div class="aspect-[4/3] rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden sm:col-span-1 lg:col-span-1">
            <img class="h-full w-full object-cover" src="https://picsum.photos/seed/mpea4/800/600" alt="MPEA photo 4" />
          </div>
        </div>
      </div>
    </section>

    <!-- Features / Services & Advantages -->
    <section id="features" class="py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl">
          <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">业务与优势</h2>
          <p class="mt-4 text-slate-600">面向家庭、学校与社区，提供系统化的蒙台梭利教育解决方案。</p>
        </div>
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div class="group rounded-xl bg-white ring-1 ring-slate-200 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div class="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 grid place-content-center">🏠</div>
            <h3 class="mt-4 font-semibold text-slate-900">家庭有准备的环境</h3>
            <p class="mt-2 text-sm text-slate-600">0-6岁分阶指导，帮助家长搭建成长友好的家庭环境。</p>
          </div>
          <div class="group rounded-xl bg-white ring-1 ring-slate-200 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div class="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 grid place-content-center">📚</div>
            <h3 class="mt-4 font-semibold text-slate-900">课程体系与工具</h3>
            <p class="mt-2 text-sm text-slate-600">本土化课程与实践手册，工具即拿即用。</p>
          </div>
          <div class="group rounded-xl bg-white ring-1 ring-slate-200 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div class="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 grid place-content-center">🤝</div>
            <h3 class="mt-4 font-semibold text-slate-900">家庭-学校-社区联动</h3>
            <p class="mt-2 text-sm text-slate-600">三位一体生态，促进家校社协同育人。</p>
          </div>
          <div class="group rounded-xl bg-white ring-1 ring-slate-200 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div class="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 grid place-content-center">🧑‍🏫</div>
            <h3 class="mt-4 font-semibold text-slate-900">专业师资与认证</h3>
            <p class="mt-2 text-sm text-slate-600">分级讲师与MPC认证支持，保障教学质量。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Recommended Kindergartens -->
    <section id="kindergartens" class="py-16 sm:py-24 bg-slate-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">
              {{ lang === 'zh' ? '推荐幼儿园' : 'Recommended Kindergartens' }}
            </h2>
            <p class="mt-2 text-slate-600">
              {{
                lang === 'zh'
                  ? '甄选优质蒙台梭利幼儿园，支持双语信息呈现'
                  : 'Selected Montessori kindergartens with bilingual information'
              }}
            </p>
          </div>
          <a href="#join" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm hover:bg-indigo-500">
            {{ lang === 'zh' ? '申请合作' : 'Apply to Partner' }}
            <span aria-hidden>→</span>
          </a>
        </div>

        <div class="mt-10">
          <div v-if="kindergartenLoading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="n in 3" :key="n" class="rounded-xl bg-white p-6 ring-1 ring-slate-200 animate-pulse">
              <div class="h-12 w-12 rounded-full bg-slate-200"></div>
              <div class="mt-6 h-4 w-2/3 rounded bg-slate-200"></div>
              <div class="mt-3 h-3 w-5/6 rounded bg-slate-200"></div>
              <div class="mt-8 h-3 w-3/4 rounded bg-slate-200"></div>
            </div>
          </div>
          <div v-else-if="kindergartens.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="item in kindergartens"
              :key="item.id"
              class="rounded-xl bg-white p-6 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div class="flex items-center gap-4">
                <img v-if="item.logo" :src="resolveImage(item.logo)" :alt="item.name" class="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200" />
                <div v-else class="h-14 w-14 rounded-full bg-slate-100 ring-1 ring-slate-200 grid place-content-center text-slate-400 text-sm">
                  LOGO
                </div>
                <div>
                  <p class="text-base font-semibold text-slate-900">{{ item.name }}</p>
                  <p class="text-sm text-slate-500">{{ item.nameEn }}</p>
                </div>
              </div>
              <div class="mt-6 space-y-2 text-sm leading-6 text-slate-600">
                <p>
                  <span class="font-medium text-slate-900">{{ lang === 'zh' ? '地址（中文）' : 'Address (CN)' }}：</span>
                  {{ item.address }}
                </p>
                <p>
                  <span class="font-medium text-slate-900">{{ lang === 'zh' ? '地址（英文）' : 'Address (EN)' }}：</span>
                  {{ item.addressEn }}
                </p>
              </div>
            </article>
          </div>
          <div v-else class="rounded-xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200">
            {{ lang === 'zh' ? '暂无推荐幼儿园，敬请期待。' : 'No recommended kindergartens yet. Stay tuned.' }}
          </div>
        </div>
      </div>
    </section>

    <!-- Certification & Partners -->
    <section id="cert" class="py-16 sm:py-24 bg-slate-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">认证与合作</h2>
            <ul class="mt-6 space-y-3 text-slate-700">
              <li class="flex gap-3"><span class="mt-2 h-2.5 w-2.5 rounded-full bg-indigo-500"></span><span>MPC 蒙氏家长认证体系（评估标准与路径）</span></li>
              <li class="flex gap-3"><span class="mt-2 h-2.5 w-2.5 rounded-full bg-indigo-500"></span><span>与学校、机构共建示范性“有准备的环境”</span></li>
              <li class="flex gap-3"><span class="mt-2 h-2.5 w-2.5 rounded-full bg-indigo-500"></span><span>国际专家网络合作与资源共享</span></li>
            </ul>
            <div class="mt-6">
              <a href="#join" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-white shadow hover:bg-indigo-500">
                了解合作
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
          <div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div class="aspect-[3/2] rounded-xl bg-white ring-1 ring-slate-200 grid place-content-center text-slate-500">Partner A</div>
              <div class="aspect-[3/2] rounded-xl bg-white ring-1 ring-slate-200 grid place-content-center text-slate-500">Partner B</div>
              <div class="aspect-[3/2] rounded-xl bg-white ring-1 ring-slate-200 grid place-content-center text-slate-500">Partner C</div>
              <div class="aspect-[3/2] rounded-xl bg-white ring-1 ring-slate-200 grid place-content-center text-slate-500">Partner D</div>
              <div class="aspect-[3/2] rounded-xl bg-white ring-1 ring-slate-200 grid place-content-center text-slate-500">Partner E</div>
              <div class="aspect-[3/2] rounded-xl bg-white ring-1 ring-slate-200 grid place-content-center text-slate-500">Partner F</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Timeline -->
    <section id="timeline" class="py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">发展里程碑</h2>
        <div class="mt-10 grid lg:grid-cols-2 gap-12">
          <div class="relative pl-6">
            <div class="absolute left-0 top-0 bottom-0 w-px bg-slate-200"></div>
            <ol class="space-y-6">
              <li class="relative">
                <span class="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                <p class="font-medium text-slate-900">2016</p>
                <p class="text-slate-700">美国肯塔基州家长社群成立，启动首期《家庭蒙台梭利21天实践陪跑营》</p>
              </li>
              <li class="relative">
                <span class="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                <p class="font-medium text-slate-900">2018</p>
                <p class="text-slate-700">出版《蒙氏家庭实践指南》中文电子手册，下载量突破10万次</p>
              </li>
              <li class="relative">
                <span class="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                <p class="font-medium text-slate-900">2020</p>
                <p class="text-slate-700">中国本土化课程体系研发完成，建立0-6岁分阶指导模型</p>
              </li>
            </ol>
          </div>
          <div class="relative pl-6">
            <div class="absolute left-0 top-0 bottom-0 w-px bg-slate-200"></div>
            <ol class="space-y-6">
              <li class="relative">
                <span class="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                <p class="font-medium text-slate-900">2022</p>
                <p class="text-slate-700">举办首届全球蒙氏家长峰会，12国专家共研“文化融合中的蒙氏实践”</p>
              </li>
              <li class="relative">
                <span class="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                <p class="font-medium text-slate-900">2023</p>
                <p class="text-slate-700">启动蒙氏家长认证体系（MPC），建立全球首个家长能力评估标准</p>
              </li>
              <li class="relative">
                <span class="absolute -left-[9px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                <p class="font-medium text-slate-900">2024</p>
                <p class="text-slate-700">MPEA中国总部成立，上线“蒙氏家庭成长学院”在线学习平台</p>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>

    <!-- Teachers -->
    <section id="teachers" class="py-16 sm:py-24 bg-slate-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">MPEA讲师</h2>
        <p class="mt-3 text-slate-600">预留6位讲师照片坑位</p>
        <div class="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          <div v-for="n in 6" :key="n" class="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
            <div class="aspect-[3/4] bg-slate-100">
              <img :src="`https://picsum.photos/seed/mpeat${n}/600/800`" :alt="`讲师 ${n}`" class="h-full w-full object-cover" />
            </div>
            <div class="px-3 py-3">
              <p class="font-medium text-slate-900">讲师 {{ n }}</p>
              <p class="text-sm text-slate-600">职位/擅长方向</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Professional Faculty -->
    <section id="faculty" class="py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">MPEA专业师资</h2>
          <div class="inline-flex rounded-lg bg-slate-100 p-1 ring-1 ring-inset ring-slate-200">
            <button
              v-for="tab in levelTabs"
              :key="tab"
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              :class="tab === activeLevel ? 'bg-white text-indigo-600 shadow ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'"
              @click="setActive(tab)">
              {{ tab }}
            </button>
          </div>
        </div>

        <div class="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="rounded-xl bg-white ring-1 ring-slate-200 p-6">
            <h3 class="font-semibold text-slate-900">等级：{{ activeLevel }}</h3>
            <p class="mt-2 text-sm text-slate-600">点击切换等级查看示例列表</p>
            <ul class="mt-4 space-y-2 text-slate-700">
              <li v-for="t in levelToTeachers[activeLevel]" :key="t" class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                <span>{{ t }}</span>
              </li>
            </ul>
          </div>
          <div class="rounded-xl bg-white ring-1 ring-slate-200 p-6">
            <h3 class="font-semibold text-slate-900">培养方向</h3>
            <ul class="mt-4 space-y-2 text-slate-700">
              <li class="flex gap-2"><span class="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2"></span><span>家长教育者培养体系</span></li>
              <li class="flex gap-2"><span class="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2"></span><span>教师/育儿顾问继续教育</span></li>
              <li class="flex gap-2"><span class="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2"></span><span>蒙氏理念本土化与实践落地</span></li>
            </ul>
          </div>
          <div class="rounded-xl bg-white ring-1 ring-slate-200 p-6">
            <h3 class="font-semibold text-slate-900">课程示例</h3>
            <ul class="mt-4 space-y-2 text-slate-700">
              <li class="flex gap-2"><span class="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2"></span><span>0-6岁分阶指导模型</span></li>
              <li class="flex gap-2"><span class="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2"></span><span>家庭“有准备的环境”搭建</span></li>
              <li class="flex gap-2"><span class="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2"></span><span>MPC 家长认证准备</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Join CTA -->
    <section id="join" class="py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 p-8 sm:p-12 text-white">
          <div class="relative z-10">
            <h2 class="text-2xl sm:text-3xl font-bold">{{ lang === 'zh' ? '加入MPEA，共建有准备的环境' : 'Join MPEA and build a prepared environment' }}</h2>
            <p class="mt-3 text-white/90">{{ lang === 'zh' ? '与万千家庭同行，让每个孩子自然绽放。' : 'Walk with thousands of families and let every child bloom naturally.' }}</p>
            <div class="mt-6">
              <a href="#" class="inline-flex items-center gap-2 rounded-lg bg-white/90 px-5 py-3 text-indigo-700 font-medium shadow hover:bg-white">
                {{ lang === 'zh' ? '立即加入' : 'Join Now' }}
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
          <div class="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/20 blur-2xl"></div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-200">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-slate-500">
        <p>© 2025 MPEA 蒙台梭利家长教育协会</p>
      </div>
    </footer>
  </main>
</template>

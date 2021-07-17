<template>
  <div>
    <router-view />
    <unrest-ui />
    <div class="fixed bottom-0 right-0 m-4 flex gap-2 text-lg">
      <button class="btn -primary" @click="$ui.alert({ tagName: 'debug-form' })">
        <i class="fa fa-terminal" />
      </button>
      <button class="btn -primary" @click="$ui.alert({ tagName: 'new-game-form' })">
        <i class="fa fa-plus" />
      </button>
    </div>
  </div>
</template>

<script></script>

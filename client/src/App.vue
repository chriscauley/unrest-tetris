<template>
  <div>
    <router-view />
    <unrest-ui />
    <div class="unrest-floating-actions">
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

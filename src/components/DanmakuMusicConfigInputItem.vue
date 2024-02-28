<template>
  <tr class="input">
    <td>{{ label }}</td>
    <td>
      <input
        :type="inputType"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        :disabled="isDisabled"
      />
    </td>
    <td v-if="showButton">
      <button @click="buttonClick">{{ buttonText }}</button>
    </td>
  </tr>
</template>

<script>
export default {
  props: {
    label: String,
    modelValue: [String, Number], // 接收 String 或 Number 类型的 prop
    inputType: { type: String, default: 'text' },
    placeholder: String,
    isDisabled: { type: Boolean, default: false },
    showButton: { type: Boolean, default: false },
    buttonText: String,
  },
  methods: {
    updateValue(event) {
      this.localValue = event.target.value; // 更新本地值，触发 setter
    },
    buttonClick() {
      this.$emit('buttonClick'); // 按钮点击事件
    },
  },
};
</script>

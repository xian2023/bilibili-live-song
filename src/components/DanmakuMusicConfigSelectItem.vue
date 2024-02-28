<template>
  <tr class="select">
    <td>{{ label }}</td>
    <td>
      <select :value="localValue" @change="handleChange" size="4">
        <option v-for="item in options" :value="item.value" :key="item.id">
          {{ item.text }}
        </option>
      </select>
    </td>
    <td>
      <button @click="buttonClick">{{ buttonText }}</button>
    </td>
  </tr>
</template>

<script>
export default {
  props: {
    label: String,
    modelValue: [String, Number, Object], // Can be String, Number, or Object
    options: Array,
    buttonText: String,
  },
  emits: ['update:modelValue', 'buttonClick'], // Emitting 'update:modelValue' for v-model compatibility
  computed: {
    localValue: {
      get() {
        return this.modelValue; // Get prop value
      },
      set(value) {
        this.$emit('update:modelValue', value); // Emit event for parent component
      },
    },
  },
  methods: {
    handleChange(event) {
      this.localValue = event.target.value; // Update local value which triggers the setter
    },
    buttonClick() {
      this.$emit('buttonClick'); // Emitting button click event
    },
  },
};
</script>

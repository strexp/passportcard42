<script setup lang="ts">
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  darkTheme,
  dateEnUS,
  enUS,
} from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

import GeneratorApp from '@/components/GeneratorApp.vue'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#d8f36a',
    primaryColorHover: '#e5ff84',
    primaryColorPressed: '#b9d44b',
    primaryColorSuppl: '#d8f36a',
    infoColor: '#8ad6c7',
    successColor: '#9fe870',
    warningColor: '#e7c56b',
    errorColor: '#ef7b75',
    textColorBase: '#f1eee6',
    textColor1: '#f4f1ea',
    textColor2: '#cbc8c0',
    textColor3: '#8f8e88',
    textColorDisabled: '#64645f',
    bodyColor: '#0b0c0e',
    cardColor: '#121416',
    modalColor: '#121416',
    popoverColor: '#171a1c',
    inputColor: '#0f1113',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    dividerColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '9px',
    borderRadiusSmall: '6px',
    fontFamily: '"Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    fontFamilyMono: '"SFMono-Regular", "JetBrains Mono", Consolas, monospace',
  },
  Input: {
    color: 'rgba(255, 255, 255, 0.035)',
    colorFocus: 'rgba(255, 255, 255, 0.055)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    borderHover: '1px solid rgba(255, 255, 255, 0.18)',
    borderFocus: '1px solid rgba(216, 243, 106, 0.7)',
    boxShadowFocus: '0 0 0 3px rgba(216, 243, 106, 0.10)',
    heightMedium: '36px',
    fontSizeMedium: '13px',
  },
  InputNumber: {
    peers: {
      Input: {
        color: 'rgba(255, 255, 255, 0.035)',
        colorFocus: 'rgba(255, 255, 255, 0.055)',
      },
    },
  },
  DatePicker: {
    panelColor: '#15181a',
    itemColorHover: 'rgba(216, 243, 106, 0.08)',
    itemColorActive: 'rgba(216, 243, 106, 0.16)',
    itemTextColorActive: '#e9ffa0',
    calendarTitleTextColor: '#f1eee6',
    calendarDaysTextColor: '#a4a29b',
    iconColor: '#9b9a94',
  },
  Select: {
    peers: {
      InternalSelection: {
        color: 'rgba(255, 255, 255, 0.035)',
        colorActive: 'rgba(255, 255, 255, 0.055)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        borderHover: '1px solid rgba(255, 255, 255, 0.18)',
        borderActive: '1px solid rgba(216, 243, 106, 0.7)',
        boxShadowActive: '0 0 0 3px rgba(216, 243, 106, 0.10)',
        heightMedium: '36px',
      },
      InternalSelectMenu: {
        color: '#15181a',
        optionTextColor: '#cbc8c0',
        optionTextColorActive: '#e9ffa0',
        optionColorPending: 'rgba(255, 255, 255, 0.06)',
        optionColorActive: 'rgba(216, 243, 106, 0.12)',
      },
    },
  },
  Switch: {
    railColor: 'rgba(255, 255, 255, 0.14)',
    railColorActive: '#b9d44b',
    buttonColor: '#f4f1ea',
  },
  Modal: {
    color: '#121416',
  },
  Button: {
    borderRadiusMedium: '9px',
    fontWeight: '600',
  },
  Message: {
    color: '#171a1c',
    textColor: '#f1eee6',
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.45)',
  },
}
</script>

<template>
  <n-config-provider
    :theme="darkTheme"
    :theme-overrides="themeOverrides"
    :locale="enUS"
    :date-locale="dateEnUS"
  >
    <n-message-provider placement="top-right" :max="3">
      <n-dialog-provider>
        <GeneratorApp />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  NDatePicker,
  NDivider,
  NForm,
  NFormItem,
  NGrid,
  NGi,
  NInput,
  NRadioButton,
  NRadioGroup,
  NText,
} from 'naive-ui'

import EditorPanel from '@/components/editor/EditorPanel.vue'
import { cardData, normalizeCodeField, setDate, setSex } from '@/composables/useCardStore'
import { DEFAULT_CARD_DATA } from '@/lib/defaults'

const sexOptions = [
  { label: 'F', value: 'F' },
  { label: 'M', value: 'M' },
  { label: 'X', value: 'X' },
]

function handleSex(value: string | number | boolean | null): void {
  if (value === 'F' || value === 'M' || value === 'X') setSex(value)
}
</script>

<template>
  <EditorPanel>
    <NForm label-placement="top" size="small" :show-feedback="false">
      <NGrid :cols="2" :x-gap="12" :y-gap="14">
        <NGi>
          <NFormItem label="Surname">
            <NInput
              v-model:value="cardData.surname"
              :placeholder="DEFAULT_CARD_DATA.surname"
              :maxlength="32"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Given names">
            <NInput
              v-model:value="cardData.givenNames"
              :placeholder="DEFAULT_CARD_DATA.givenNames"
              :maxlength="40"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Sex">
            <NRadioGroup :value="cardData.sex" size="small" @update:value="handleSex">
              <NRadioButton v-for="option in sexOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </NRadioButton>
            </NRadioGroup>
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Nationality">
            <NInput
              :value="cardData.nationality"
              :placeholder="DEFAULT_CARD_DATA.nationality"
              :maxlength="3"
              @update:value="(value) => normalizeCodeField('nationality', value)"
            />
          </NFormItem>
        </NGi>
        <NGi :span="2">
          <NFormItem label="Date of birth">
            <NDatePicker
              :formatted-value="cardData.birthDate"
              value-format="yyyy-MM-dd"
              type="date"
              :clearable="false"
              class="full-width"
              @update:formatted-value="(value) => setDate('birthDate', value)"
            />
          </NFormItem>
        </NGi>
      </NGrid>
    </NForm>
    <NDivider />
    <NText depth="3" class="hint">
      The artwork updates immediately. MRZ characters are derived automatically from these fields.
    </NText>
  </EditorPanel>
</template>

<script setup lang="ts">
import { NDatePicker, NForm, NFormItem, NGrid, NGi, NInput, NText } from 'naive-ui'

import EditorPanel from '@/components/editor/EditorPanel.vue'
import IssuerFields from '@/components/editor/IssuerFields.vue'
import {
  cardData,
  normalizeCan,
  normalizeDocumentNumber,
  setDate,
} from '@/composables/useCardStore'
import { DEFAULT_CARD_DATA } from '@/lib/defaults'
</script>

<template>
  <EditorPanel>
    <NForm label-placement="top" size="small" :show-feedback="false">
      <NGrid :cols="2" :x-gap="12" :y-gap="14">
        <NGi :span="2">
          <NFormItem label="Document number">
            <NInput
              :value="cardData.documentNumber"
              :placeholder="DEFAULT_CARD_DATA.documentNumber"
              :maxlength="12"
              @update:value="normalizeDocumentNumber"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Issued">
            <NDatePicker
              :formatted-value="cardData.issueDate"
              value-format="yyyy-MM-dd"
              type="date"
              :clearable="false"
              class="full-width"
              @update:formatted-value="(value) => setDate('issueDate', value)"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Expiry">
            <NDatePicker
              :formatted-value="cardData.expiryDate"
              value-format="yyyy-MM-dd"
              type="date"
              :clearable="false"
              class="full-width"
              @update:formatted-value="(value) => setDate('expiryDate', value)"
            />
          </NFormItem>
        </NGi>
        <NGi :span="2">
          <NFormItem label="Authority">
            <NInput
              v-model:value="cardData.authority"
              :placeholder="DEFAULT_CARD_DATA.authority"
              :maxlength="48"
            />
          </NFormItem>
        </NGi>
        <NGi :span="2">
          <NFormItem label="Issuing office">
            <NInput
              v-model:value="cardData.issuingOffice"
              :placeholder="DEFAULT_CARD_DATA.issuingOffice"
              :maxlength="32"
            />
          </NFormItem>
        </NGi>
        <NGi :span="2">
          <NFormItem label="CAN (six digits)">
            <NInput
              :value="cardData.can"
              :placeholder="DEFAULT_CARD_DATA.can"
              :maxlength="6"
              @update:value="normalizeCan"
            />
          </NFormItem>
        </NGi>
      </NGrid>

      <NText depth="3" class="hint"
        >CAN is printed on the card and is not encoded in the MRZ.</NText
      >

      <IssuerFields />
    </NForm>
  </EditorPanel>
</template>

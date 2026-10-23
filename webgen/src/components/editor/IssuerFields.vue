<script setup lang="ts">
import { NCollapse, NCollapseItem, NFormItem, NGrid, NGi, NInput } from 'naive-ui'

import { cardData, normalizeCodeField, normalizeDocumentCode } from '@/composables/useCardStore'
</script>

<template>
  <NCollapse class="issuer-collapse">
    <NCollapseItem title="Issuer wording" name="issuer">
      <NGrid :cols="2" :x-gap="12" :y-gap="14">
        <NGi :span="2">
          <NFormItem label="Country name">
            <NInput v-model:value="cardData.countryName" :maxlength="48" />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Country code">
            <NInput
              :value="cardData.countryCode"
              :maxlength="3"
              @update:value="(value) => normalizeCodeField('countryCode', value)"
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Document type">
            <NInput v-model:value="cardData.documentType" :maxlength="32" />
          </NFormItem>
        </NGi>
        <NGi :span="2">
          <NFormItem label="Agency">
            <NInput v-model:value="cardData.agencyName" :maxlength="48" />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Version">
            <NInput v-model:value="cardData.version" :maxlength="24" />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="MRZ document code">
            <NInput
              :value="cardData.documentCode"
              :maxlength="2"
              @update:value="normalizeDocumentCode"
            />
          </NFormItem>
        </NGi>
      </NGrid>
    </NCollapseItem>
  </NCollapse>
</template>

<style scoped>
.issuer-collapse {
  margin-top: 18px;
}
</style>

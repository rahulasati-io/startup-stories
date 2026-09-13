'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'

const companyRecordTemplates = [
  ['companyPersonRole', 'Person role'],
  ['companyBusinessModelComponent', 'Business model component'],
  ['companyStrategy', 'Strategy'],
  ['companyMetric', 'Metric'],
  ['fundingRound', 'Funding or ownership record'],
  ['timelineEvent', 'Timeline event'],
] as const

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema: {
    ...schema,
    templates: (previousTemplates) => [
      ...previousTemplates.filter((template) => template.schemaType !== 'seoSettings'),
      ...companyRecordTemplates.map(([schemaType, title]) => ({
        id: `${schemaType}-for-company`,
        title: `${title} for selected company`,
        schemaType,
        parameters: [{name: 'companyId', title: 'Company ID', type: 'string'}],
        value: ({companyId}: {companyId: string}) => ({
          company: {_type: 'reference', _ref: companyId},
        }),
      })),
    ],
  },
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})

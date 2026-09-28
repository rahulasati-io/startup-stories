import {createClient} from '@sanity/client'

const {
  NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
  NEXT_PUBLIC_SANITY_DATASET: dataset,
  NEXT_PUBLIC_SANITY_API_VERSION: configuredApiVersion,
  SANITY_WRITE_TOKEN: token,
} = process.env

if (!projectId || !dataset || !token) {
  throw new Error('Missing Sanity environment variables.')
}

const apply = process.argv.includes('--apply')
const keepArgument = process.argv.find((argument) => argument.startsWith('--keep='))
const keepValue = (keepArgument?.slice('--keep='.length) || 'rahul').trim().toLowerCase()

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: configuredApiVersion || '2026-08-23',
  useCdn: false,
})

const authors = await client.fetch(
  `*[_type == "author" && !(_id in path("drafts.**"))] | order(name asc) {
    ...,
    "slugValue": slug.current
  }`,
)

const keeper = authors.find(
  (author) =>
    author.slugValue?.toLowerCase() === keepValue || author.name?.trim().toLowerCase() === keepValue,
)

if (!keeper) {
  console.error(`No published author matched "${keepValue}".`)
  console.error('Published authors:')
  for (const author of authors) {
    console.error(`- ${author.name} (${author.slugValue || 'no slug'})`)
  }
  process.exitCode = 1
} else {
  const authorsToUnpublish = authors.filter((author) => author._id !== keeper._id)
  const authorIds = authorsToUnpublish.map((author) => author._id)
  const referencedDocuments = authorIds.length
    ? await client.fetch(
        `*[_type != "author" && references($authorIds)] {
          _id,
          _type,
          title,
          "authorId": author._ref
        }`,
        {authorIds},
      )
    : []

  const unsupportedReferences = referencedDocuments.filter((document) => document._type !== 'post')
  if (unsupportedReferences.length) {
    console.error('Cannot continue because non-article documents reference authors being unpublished:')
    for (const document of unsupportedReferences) {
      console.error(`- ${document._type}: ${document._id}`)
    }
    process.exitCode = 1
  } else {
    console.log(`Keeping published: ${keeper.name} (${keeper.slugValue})`)
    console.log(`Authors to unpublish: ${authorsToUnpublish.length}`)
    for (const author of authorsToUnpublish) {
      const articleCount = referencedDocuments.filter(
        (document) => document.authorId === author._id,
      ).length
      console.log(`- ${author.name} (${author.slugValue || 'no slug'}): ${articleCount} article(s)`)
    }
    console.log(`Articles to reassign to ${keeper.name}: ${referencedDocuments.length}`)

    if (!apply) {
      console.log('Dry run only. Add --apply to make these changes.')
    } else if (!authorsToUnpublish.length) {
      console.log('No other published authors need to be unpublished.')
    } else {
      let transaction = client.transaction()

      for (const document of referencedDocuments) {
        transaction = transaction.patch(document._id, (patch) =>
          patch.set({author: {_type: 'reference', _ref: keeper._id}}),
        )
      }

      for (const author of authorsToUnpublish) {
        const draftAuthor = {...author}
        delete draftAuthor._rev
        delete draftAuthor._createdAt
        delete draftAuthor._updatedAt
        delete draftAuthor.slugValue
        transaction = transaction.createIfNotExists({
          ...draftAuthor,
          _id: `drafts.${author._id}`,
        })
        transaction = transaction.delete(author._id)
      }

      await transaction.commit()
      console.log(
        `Done. Reassigned ${referencedDocuments.length} article(s) and unpublished ${authorsToUnpublish.length} author(s).`,
      )
    }
  }
}

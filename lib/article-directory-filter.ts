// Shared by article results and homepage topic counts. Keep search semantics identical.
export const ARTICLE_DIRECTORY_FILTER = /* groq */ `_type == "post" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && defined(title) && defined(slug.current) && defined(category._ref) &&
  ($category == "" || category._ref in *[_type == "category" && (title == $category || slug.current == $category)]._id) &&
  ($company == "" || count(company[_ref in *[_type == "company" && (name == $company || slug.current == $company)]._id]) > 0) &&
  ($industry == "" || count(company[_ref in *[_type == "company" && (industry == $industry || industryCategory._ref in *[_type == "industry" && name == $industry]._id)]._id]) > 0) &&
  ($q == "" || title match $search || seoDescription match $search || category._ref in *[_type == "category" && title match $search]._id || count(company[_ref in *[_type == "company" && (name match $search || industry match $search || industryCategory._ref in *[_type == "industry" && name match $search]._id)]._id]) > 0)`;

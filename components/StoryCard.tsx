type StoryCardProps = {
  category: string;
  title: string;
  description: string;
  readTime: string;
  imageClass: string;
};

export default function StoryCard({
  category,
  title,
  description,
  readTime,
  imageClass,
}: StoryCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div
        className={`aspect-[16/10] ${imageClass} transition duration-300 group-hover:scale-[1.02]`}
      />

      <div className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
          {category}
        </p>

        <h3 className="mt-2 text-xl font-bold leading-tight tracking-tight text-zinc-950">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          {description}
        </p>

        <p className="mt-4 text-xs font-semibold text-zinc-500">
          {readTime}
        </p>
      </div>
    </article>
  );
}
export function PageHeader({ title, description, note, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50]">
          {title}
        </h1>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
        {note && (
          <p className="text-red-500 font-medium mt-1 text-xs">{note}</p>
        )}
      </div>
      {children && <div className="flex gap-2 text-red-300">{children}</div>}
    </div>
  );
}

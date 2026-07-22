import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  eyebrow,
  description,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}

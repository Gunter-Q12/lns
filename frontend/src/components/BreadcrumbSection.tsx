import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbSectionProps {
  view: { label: string }[];
  onReset: () => void;
}

export function BreadcrumbSection({
  view,
  onReset
}: BreadcrumbSectionProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 bg-background">
      <Breadcrumb>
        <BreadcrumbList>
          {view.map((crumb, index) => {
            const isLast = index === view.length - 1;
            return (
              <Fragment key={index}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();  // TODO: maybe we actually want default
                        if (crumb.label === 'Overview') {
                          onReset();
                        }
                      }}
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}

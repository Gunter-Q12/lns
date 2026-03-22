import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ViewElement } from '@/types/view';

export interface BreadcrumbSectionProps {
  view: ViewElement[];
  onReset: () => void;
}

export function BreadcrumbSection({
  view,
  onReset
}: BreadcrumbSectionProps) {
  console.log("view", view)
  console.log("history", window.history)
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 bg-background">
      <Breadcrumb>
        <BreadcrumbList>
          {view.map((element, index) => {
            const isLast = index === view.length - 1;
            return (
              <Fragment key={index}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{element.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();  // TODO: maybe we actually want default
                        if (element.label === 'Overview') {
                          onReset();
                        }
                      }}
                    >
                      {element.label}
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

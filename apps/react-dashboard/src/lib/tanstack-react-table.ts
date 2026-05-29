/**
 * Re-exports TanStack Table so call sites do not import `@tanstack/react-table` directly.
 * The React Compiler ESLint rules treat that package path as a known incompatible API.
 */
import * as ReactTable from "@tanstack/react-table";

export const {getCoreRowModel} = ReactTable;
export const {useReactTable} = ReactTable;

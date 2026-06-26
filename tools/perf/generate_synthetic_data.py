#!/usr/bin/env python3
"""Generate synthetic CSV datasets for performance benchmarking."""
import argparse
import csv
import random
import uuid


def generate_row(i, num_features=8):
    # id, some numeric features, a category, a timestamp-like integer
    row = {
        "id": str(uuid.uuid4()),
    }
    for f in range(num_features):
        row[f"feat_{f}"] = round(random.random() * 1000, 6)
    row["category"] = random.choice(["A", "B", "C", "D"])
    row["ts"] = 1670000000 + i
    return row


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--rows", type=int, default=1000, help="Number of rows to generate")
    p.add_argument("--out", required=True, help="Output CSV path")
    p.add_argument("--features", type=int, default=8, help="Number of numeric features per row")
    args = p.parse_args()

    fieldnames = ["id"] + [f"feat_{i}" for i in range(args.features)] + ["category", "ts"]
    with open(args.out, "w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for i in range(args.rows):
            writer.writerow(generate_row(i, args.features))

    print(f"Wrote {args.rows} rows to {args.out}")


if __name__ == "__main__":
    main()

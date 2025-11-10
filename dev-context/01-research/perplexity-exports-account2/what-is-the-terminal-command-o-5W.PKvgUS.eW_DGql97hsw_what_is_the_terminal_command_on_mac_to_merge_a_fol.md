<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# What is the terminal command on mac to merge a folder of CSVs while removing the header row from all but the first

To merge a folder of CSV files on a Mac while keeping only the header from the first file, you can use the following terminal command:

```bash
awk '(NR == 1) || (FNR > 1)' *.csv > combined.csv
```

This command will combine all CSV files in the current directory into a single file named "combined.csv"[^3]. It works as follows:

1. `(NR == 1)` prints the first line of the first file (the header).
2. `(FNR > 1)` prints all lines except the first from each subsequent file.
3. `*.csv` selects all CSV files in the current directory.
4. `> combined.csv` redirects the output to a new file named "combined.csv".

Before running this command, make sure to navigate to the folder containing your CSV files using the `cd` command[^1][^5]. For example:

```bash
cd /path/to/your/csv/folder
```

Then run the awk command to merge the files. This method efficiently combines multiple CSV files while preserving only the header from the first file[^3][^7].
<span style="display:none">[^2][^4][^6][^8]</span>

<div align="center">⁂</div>

[^1]: https://devinschumacher.com/how-to-combine-merge-multiple-csv-or-excel-files-for-mac-pc/

[^2]: https://stackoverflow.com/questions/16890582/unixmerge-multiple-csv-files-with-same-header-by-keeping-the-header-of-the-firs

[^3]: https://apple.stackexchange.com/questions/80611/merging-multiple-csv-files-without-merging-the-header

[^4]: https://support.eniture.com/how-to-merge-multiple-csv-files-on-a-mac

[^5]: https://community.codenewbie.org/devinschumacher/how-to-combine-multiple-csvs-into-one-combine-csvs-at-command-line-hgk

[^6]: https://apple.stackexchange.com/questions/448424/need-an-applescript-to-merge-all-csv-files-excluding-the-header-record-of-all-b

[^7]: https://stackoverflow.com/questions/48446469/how-to-merge-multiple-csv-files-into-one-using-terminal-on-mac-os

[^8]: https://mrdif.com/merge-multiple-csv-files-into-one-mac/


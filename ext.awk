$0 !~ /.*\.db/ && $0 !~ /.*\.DS_Store/ {
   size=split($0, p, ".")
#   print p[size]
   word[p[size]]++
}
END {
   for (ext in word) {
      print ext
   }
}

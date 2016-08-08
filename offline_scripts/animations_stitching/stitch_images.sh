ffmpeg -f image2 -r 1/5 -r 15 -i animation_%03d.png -vb 20M -pix_fmt yuv420p out.mp4
